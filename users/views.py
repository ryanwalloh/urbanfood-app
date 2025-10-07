import json
import logging
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.contrib.auth import authenticate, login
from django.db import transaction
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, SMSVerification
from .serializers import UserSerializer
from .sms_service import sms_service

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def send_verification_code(request):
    """
    Send verification code via email (primary) and SMS (fallback).
    For customers, email-only is allowed. For riders, phone is required.
    """
    try:
        data = json.loads(request.body)
        phone_number = data.get('phone_number')
        email = data.get('email')
        role = data.get('role', 'customer')  # Default to customer

        # For riders, enforce phone number; for customers, allow email-only
        if role == 'rider':
            if not phone_number:
                return JsonResponse({'success': False, 'error': 'Phone number is required for riders'}, status=400)
        else:
            # Default assume customer flow if not specified
            if not phone_number and not email:
                return JsonResponse({'success': False, 'error': 'Email or phone number is required'}, status=400)

        # Check if phone number already exists (when provided)
        if phone_number and User.objects.filter(phone_number=phone_number).exists():
            return JsonResponse({'success': False, 'error': 'Phone number already registered'}, status=400)

        # Check if email already exists (when provided)
        if email and User.objects.filter(email=email).exists():
            return JsonResponse({'success': False, 'error': 'Email already registered'}, status=400)

        # Create verification code (no user data stored yet)
        verification = SMSVerification.objects.create(
            phone_number=phone_number or '',
            user_data={'email': email, 'role': role} if email else {}
        )

        # Send verification code (email primary, SMS fallback)
        success = sms_service.send_verification_code(phone_number, verification.code, email)
        if not success:
            error_detail = sms_service.last_error or 'Failed to send verification code'
            # Always allow fallback in this environment so registration can proceed
            logger.warning(f"Email send failed. Using fallback. To: {email or phone_number}, Code: {verification.code}, Error: {error_detail}")
            return JsonResponse({
                'success': True,
                'message': 'Verification code generated (fallback).',
                'verification_id': verification.id,
                'delivery_error': error_detail,
                'debug_fallback': True,
                'code': verification.code,
            })

        # Verification code sent successfully
        return JsonResponse({
            'success': True,
            'message': 'Verification code sent successfully',
            'verification_id': verification.id
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error in send_verification_code: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def verify_sms_code(request):
    """
    Verify code and create account for rider or customer based on user_data.role.
    Riders require vehicle/license; customers accept address fields.
    """
    try:
        data = json.loads(request.body)
        verification_id = data.get('verification_id')
        code = data.get('code')
        
        # User data from mobile app
        user_data = data.get('user_data', {})

        if not verification_id or not code:
            return JsonResponse({
                'success': False,
                'error': 'Missing verification ID or code'
            }, status=400)

        try:
            verification = SMSVerification.objects.get(id=verification_id)
        except SMSVerification.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Invalid verification ID'
            }, status=400)

        # Check if verification can still be attempted
        if not verification.can_attempt_verification():
            if verification.is_expired():
                return JsonResponse({
                    'success': False,
                    'error': 'Verification code has expired'
                }, status=400)
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Too many verification attempts'
                }, status=400)

        # Increment attempts
        verification.attempts += 1
        verification.save()

        # Verify code
        if verification.code != code:
            return JsonResponse({
                'success': False,
                'error': 'Invalid verification code',
                'attempts_remaining': 3 - verification.attempts
            }, status=400)

        # Code is correct - create user account
        with transaction.atomic():
            # Extract user data from request
            email = user_data.get('email')
            username = user_data.get('username')
            first_name = user_data.get('firstName')
            last_name = user_data.get('lastName')
            password = user_data.get('password')
            role = user_data.get('role', 'customer')
            phone_number = verification.phone_number or user_data.get('phone_number')

            # Common validations
            if not all([email, username, first_name, last_name, password]):
                return JsonResponse({'success': False, 'error': 'Missing required user data'}, status=400)
            if User.objects.filter(email=email).exists():
                return JsonResponse({'success': False, 'error': 'User with this email already exists'}, status=400)
            if User.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'error': 'Username already taken'}, status=400)

            if role == 'customer':
                # Optional address fields
                street = user_data.get('street')
                barangay = user_data.get('barangay')
                note = user_data.get('note') or ''
                label = user_data.get('label') or 'home'

                # Create user (no phone required for customers)
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=phone_number or None,
                    role='customer',
                    is_phone_verified=True
                )

                # Create Customer profile (required by model)
                from customer.models import Customer
                Customer.objects.create(
                    user=user,
                    address=f"{street or ''}, {barangay or ''}".strip(', '),
                    phone=phone_number or ''
                )

                # Create Address if provided
                if street or barangay:
                    try:
                        from customer.models import Address
                        Address.objects.update_or_create(
                            user=user,
                            defaults={
                                'street': street or '',
                                'barangay': barangay or '',
                                'note': note,
                                'label': label,
                            }
                        )
                    except Exception:
                        pass
            else:
                # Rider flow
                vehicle_type = user_data.get('vehicleType')
                license_number = user_data.get('licenseNumber')
                if not all([vehicle_type, license_number, phone_number]):
                    return JsonResponse({'success': False, 'error': 'Missing rider-specific data'}, status=400)

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    phone_number=phone_number,
                    role='rider',
                    is_phone_verified=True
                )
                from rider.models import Rider
                Rider.objects.create(
                    user=user,
                    vehicle_type=vehicle_type,
                    license_number=license_number,
                    phone=phone_number
                )

            # Mark verification as successful
            verification.is_verified = True
            verification.save()

            # ✅ Authenticate the user in the session (same as login)
            login(request, user)

            logger.info(f"Account created successfully for {user.email} ({user.role})")

            # Build response user dict
            user_payload = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'phone_number': user.phone_number,
                'is_phone_verified': user.is_phone_verified,
                # Include names in both snake_case and camelCase for client compatibility
                'first_name': user.first_name,
                'last_name': user.last_name,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'name': user.get_full_name(),
            }

            if user.role == 'rider':
                try:
                    from rider.models import Rider as RiderProfile
                    rider_profile = RiderProfile.objects.get(user=user)
                    user_payload.update({
                        'vehicle_type': rider_profile.vehicle_type,
                        'license_number': rider_profile.license_number,
                        'is_available': rider_profile.is_available,
                    })
                except Exception:
                    user_payload.update({
                        'vehicle_type': None,
                        'license_number': None,
                        'is_available': False,
                    })
            elif user.role == 'customer':
                try:
                    from customer.models import Customer as CustomerProfile, Address
                    customer_profile = CustomerProfile.objects.get(user=user)
                    address = Address.objects.filter(user=user).first()
                    user_payload.update({
                        'address': customer_profile.address,
                        'phone': customer_profile.phone,
                        'street': address.street if address else '',
                        'barangay': address.barangay if address else '',
                        'note': address.note if address else '',
                        'label': address.label if address else 'home',
                    })
                except Exception:
                    user_payload.update({
                        'address': '',
                        'phone': '',
                        'street': '',
                        'barangay': '',
                        'note': '',
                        'label': 'home',
                    })
            
            return JsonResponse({'success': True, 'message': 'Account created successfully', 'user': user_payload})

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error in verify_sms_code: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def resend_verification_code(request):
    """
    Resend verification code
    """
    try:
        data = json.loads(request.body)
        verification_id = data.get('verification_id')

        if not verification_id:
            return JsonResponse({
                'success': False,
                'error': 'Missing verification ID'
            }, status=400)

        try:
            verification = SMSVerification.objects.get(id=verification_id)
        except SMSVerification.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Invalid verification ID'
            }, status=400)

        # Check if verification is already verified
        if verification.is_verified:
            return JsonResponse({
                'success': False,
                'error': 'Phone number already verified'
            }, status=400)

        # Check if too many attempts
        if verification.attempts >= 3:
            return JsonResponse({
                'success': False,
                'error': 'Too many verification attempts'
            }, status=400)

        # Generate new code and extend expiry
        verification.code = SMSVerification.generate_code()
        verification.expires_at = timezone.now() + timezone.timedelta(minutes=5)
        verification.attempts = 0  # Reset attempts
        verification.save()

        # Send SMS (with email fallback if available)
        if sms_service.is_configured():
            # Try to get email from user_data if available
            email = verification.user_data.get('email') if verification.user_data else None
            success = sms_service.send_verification_code(verification.phone_number, verification.code, email)
            if not success:
                error_detail = sms_service.last_error or 'Failed to send verification code'
                return JsonResponse({
                    'success': False,
                    'error': error_detail
                }, status=500)
        else:
            # For development/testing
            logger.info(f"DEVELOPMENT: New SMS code for {verification.phone_number} is: {verification.code}")

        return JsonResponse({
            'success': True,
            'message': 'Verification code resent successfully'
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error in resend_verification_code: {str(e)}")
        return JsonResponse({
            'success': False,
            'error': 'Internal server error'
        }, status=500)
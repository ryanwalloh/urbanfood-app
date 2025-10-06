import json
import logging
from django.http import JsonResponse
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
    Send SMS verification code to rider's phone number
    """
    try:
        data = json.loads(request.body)
        phone_number = data.get('phone_number')

        if not phone_number:
            return JsonResponse({
                'success': False,
                'error': 'Phone number is required'
            }, status=400)

        # Check if phone number already exists
        if User.objects.filter(phone_number=phone_number).exists():
            return JsonResponse({
                'success': False,
                'error': 'Phone number already registered'
            }, status=400)

        # Create verification code (no user data stored yet)
        verification = SMSVerification.objects.create(
            phone_number=phone_number
        )

        # Send SMS
        if sms_service.is_configured():
            success = sms_service.send_verification_code(phone_number, verification.code)
            if not success:
                return JsonResponse({
                    'success': False,
                    'error': 'Failed to send verification code'
                }, status=500)
        else:
            # For development/testing - log the code
            logger.info(f"DEVELOPMENT: SMS code for {phone_number} is: {verification.code}")
            # Still return success for testing

        # Store user data in session or temporary storage
        # For now, we'll store it in the verification record
        verification.user_data = {
            'email': email,
            'username': username,
            'first_name': first_name,
            'last_name': last_name,
            'password': password,
            'vehicle_type': vehicle_type,
            'license_number': license_number,
            'phone_number': phone_number
        }
        verification.save()

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
    Verify SMS code and create rider account
    """
    try:
        data = json.loads(request.body)
        verification_id = data.get('verification_id')
        code = data.get('code')

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
            user_data = verification.user_data
            
            # Create user
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password=user_data['password'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                phone_number=user_data['phone_number'],
                role='rider',
                is_phone_verified=True
            )

            # Mark verification as successful
            verification.is_verified = True
            verification.save()

            # You can add rider-specific fields here if needed
            # For example, if you have a separate Rider model:
            # Rider.objects.create(
            #     user=user,
            #     vehicle_type=user_data['vehicle_type'],
            #     license_number=user_data['license_number']
            # )

            logger.info(f"Rider account created successfully for {user.email}")

            return JsonResponse({
                'success': True,
                'message': 'Account created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role,
                    'phone_number': user.phone_number,
                    'is_phone_verified': user.is_phone_verified
                }
            })

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

        # Send SMS
        if sms_service.is_configured():
            success = sms_service.send_verification_code(verification.phone_number, verification.code)
            if not success:
                return JsonResponse({
                    'success': False,
                    'error': 'Failed to send verification code'
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
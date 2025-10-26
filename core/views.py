from django.shortcuts import render, redirect, HttpResponse
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import MagicLink
import uuid
from django.http import JsonResponse
import json
from django.contrib.auth import get_user_model
from users.models import User
import logging
from restaurant.models import Restaurant
from orders.models import Order, OrderLine
from rider.models import Rider
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.contrib.auth import authenticate
from django.utils.timezone import now
from django.contrib.auth.hashers import make_password
from customer.models import Customer
from menu.models import Product, CartItem
from django.views.decorators.csrf import csrf_exempt
from restaurant.models import Restaurant
import stripe
import os
from django.views.decorators.http import require_POST


def landing_page(request):
    return render(request, 'core/landing_page.html', {
        'timestamp': now().timestamp()
    })

# Set up logger
logger = logging.getLogger(__name__)

def request_magic_link(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = json.loads(request.body)
        email = data.get('email')
        
         # Log the received email
        logger.info(f"Email received: {email}")  # Logs the email for debugging
        print(f"Email received: {email}")
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Email not found'})

        # Generate the magic link token and expiration time
        token = uuid.uuid4()
        expires_at = timezone.now() + timedelta(minutes=15)

        # Create a MagicLink object in the database
        magic_link = MagicLink(user=user, token=token, expires_at=expires_at)
        magic_link.save()

        # Send the magic link to the user's email
        magic_link_url = f"{settings.SITE_URL}/magic-link-login/{token}/"
        try:
            send_mail(
                'Your Magic Link for Login',
                f'Click the following link to log in: {magic_link_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return JsonResponse({'message': 'Magic link sent successfully! Click the link to securely log in.'})
        except Exception as e:
            # If email sending fails, still return success but indicate to use password login
            logger.warning(f"Magic link email failed to send for {email}: {e}")
            return JsonResponse({
                'success': True, 
                'email_found': True,
                'message': 'Email found. Please use password login instead.'
            })


    return JsonResponse({'error': 'Invalid request'}, status=400)

def magic_link_login(request, token):
    try:
        magic_link = MagicLink.objects.get(token=token)

        if magic_link.is_expired():
            return HttpResponse('Magic link has expired')

        user = magic_link.user
        login(request, user)  # Logs the user in

        # Redirect based on role
        if user.role == 'customer':
            return redirect(reverse('core:customer_home'))
        elif user.role == 'restaurant':
            return redirect(reverse('core:restaurant_home'))
        elif user.role == 'rider':
            return redirect(reverse('core:rider_home'))
        elif user.role == 'demo':
            return redirect(reverse('core:dashboard'))
        else:
            return HttpResponse('Unknown role')

    except MagicLink.DoesNotExist:
        return HttpResponse('Invalid magic link')
    

def dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'demo':
        return render(request, 'core/landing_page.html')

    restaurants = Restaurant.objects.all()
    total_orders = Order.objects.count()

    restaurant_data = []
    for restaurant in restaurants:
        order_count = Order.objects.filter(restaurant=restaurant.user).count()
        restaurant_data.append({
            'name': restaurant.name,
            'profile_picture': restaurant.profile_picture.url if restaurant.profile_picture else '/static/default.png',
            'order_count': order_count,
        })

    # Pending orders can be included if needed
    pending_orders = Order.objects.filter(status='pending').select_related('customer__user', 'restaurant', 'restaurant__user').prefetch_related('items__product')

    context = {
        'total_orders': total_orders,
        'restaurant_data': restaurant_data,
    }

    return JsonResponse(context)

def customer_home(request):
    if not request.user.is_authenticated or request.user.role != 'customer':
        return render(request, 'core/landing_page.html')
    
    restaurants = Restaurant.objects.filter(is_approved=True)  # or .all() for testing
    return render(request, 'customer/main_page.html', {'restaurants': restaurants})

def restaurant_home(request):
    if not request.user.is_authenticated or request.user.role != 'restaurant':
        return redirect('core:landing_page')

    try:
        restaurant = request.user.restaurant  # Assuming OneToOneField
    except:
        restaurant = None

    # Get profile picture URL (handle Cloudinary)
    restaurant_profile_url = ''
    if restaurant and restaurant.profile_picture:
        pic_url = str(restaurant.profile_picture)
        if pic_url.startswith('http'):
            restaurant_profile_url = pic_url
        else:
            restaurant_profile_url = request.build_absolute_uri(restaurant.profile_picture.url)

    pending_orders = Order.objects.filter(
        restaurant=request.user,
        status='pending'
    ).order_by('-created_at').prefetch_related('items__product', 'customer')

    preparing_orders = Order.objects.filter(
        restaurant=request.user,
        status='preparing'
    ).order_by('-created_at').prefetch_related('items__product', 'customer')
    
    ready_orders = Order.objects.filter(
        restaurant=request.user, 
        status='ready'
    ).order_by('-created_at').prefetch_related('items__product', 'customer')

    return render(request, 'restaurant/dashboard.html', {
        'restaurant': restaurant,
        'restaurant_profile_url': restaurant_profile_url,
        'pending_orders': pending_orders,
        'preparing_orders': preparing_orders,
        'ready_orders': ready_orders,
    })


def rider_home(request):
    rider = get_object_or_404(Rider, user=request.user)
    return render(request, 'rider/dashboard.html', {'rider': rider})


@csrf_exempt
def login_by_password(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        try:
            found_user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid email or password'})

        user = authenticate(request, username=found_user.username, password=password)

        if user is not None:
            login(request, user)
            
            # Prepare user data for response
            user_data = {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'role': user.role,
            }
            
            # Add phone number and address from Customer and Address models if user is a customer
            if user.role == 'customer':
                try:
                    from customer.models import Customer, Address
                    customer = Customer.objects.get(user=user)
                    user_data['phone'] = customer.phone
                    
                    # Add address information
                    try:
                        address = Address.objects.get(user=user)
                        user_data['street'] = address.street
                        user_data['barangay'] = address.barangay
                        user_data['note'] = address.note
                        user_data['label'] = address.label
                    except Address.DoesNotExist:
                        user_data['street'] = ''
                        user_data['barangay'] = ''
                        user_data['note'] = ''
                        user_data['label'] = 'home'
                except Customer.DoesNotExist:
                    user_data['phone'] = ''
                    user_data['street'] = ''
                    user_data['barangay'] = ''
                    user_data['note'] = ''
                    user_data['label'] = 'home'
                
                return JsonResponse({
                    'success': True, 
                    'redirect_url': reverse('core:customer_home'),
                    'user': user_data
                })
            elif user.role == 'restaurant':
                return JsonResponse({
                    'success': True, 
                    'redirect_url': reverse('core:restaurant_home'),
                    'user': user_data
                })
            elif user.role == 'rider':
                # Add rider-specific data from Rider model
                try:
                    from rider.models import Rider
                    rider = Rider.objects.get(user=user)
                    user_data.update({
                        'vehicle_type': rider.vehicle_type,
                        'license_number': rider.license_number,
                        'phone': rider.phone,
                        'is_available': rider.is_available,
                    })
                except Rider.DoesNotExist:
                    # If no Rider record exists, add empty values
                    user_data.update({
                        'vehicle_type': '',
                        'license_number': '',
                        'phone': '',
                        'is_available': False,
                    })
                
                return JsonResponse({
                    'success': True, 
                    'redirect_url': reverse('core:rider_home'),
                    'user': user_data
                })
            elif user.role == 'demo':
                return JsonResponse({
                    'success': True, 
                    'redirect_url': reverse('demo:dashboard'),
                    'user': user_data
                })
            else:
                return JsonResponse({'success': False, 'error': 'Unknown role'})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid email or password'})

    return JsonResponse({'success': False, 'error': 'Invalid request'})


@csrf_exempt
def register_account(request):
    # Accept any POST (mobile clients or browsers) regardless of X-Requested-With header
    if request.method == 'POST':
        try:
            # Safely parse JSON body or fall back to form-encoded
            try:
                data = json.loads(request.body or b"{}")
            except Exception:
                data = request.POST.dict()
            email = data.get('email')
            password = data.get('password')
            username = data.get('username') or email
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            role = data.get('role')
            # Optional address payload (for mobile registration flow)
            street = data.get('street')
            barangay = data.get('barangay')
            note = data.get('note')
            label = data.get('label')

            if get_user_model().objects.filter(email=email).exists():
                return JsonResponse({'error': 'Email already registered'}, status=400)

            user = get_user_model().objects.create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                password=make_password(password)
            )

            # Handle role-specific data creation
            if role == 'rider':
                # Extract rider-specific data
                vehicle_type = data.get('vehicleType') or data.get('vehicle_type')
                license_number = data.get('licenseNumber') or data.get('license_number')
                phone_number = data.get('phoneNumber') or data.get('phone_number')
                
                # Validate required rider fields
                if not all([vehicle_type, license_number, phone_number]):
                    return JsonResponse({
                        'error': 'Missing required rider information: vehicle type, license number, and phone number are required'
                    }, status=400)
                
                # Create Rider model record
                try:
                    from rider.models import Rider
                    Rider.objects.create(
                        user=user,
                        vehicle_type=vehicle_type,
                        license_number=license_number,
                        phone=phone_number
                    )
                    logger.info(f"Rider profile created for {user.email}")
                except Exception as e:
                    logger.error(f"Failed to create rider profile for {email}: {e}")
                    return JsonResponse({
                        'error': 'Failed to create rider profile'
                    }, status=500)
            else:
                # Customer flow - handle address details
                try:
                    if street or barangay or note or label:
                        from customer.models import Address
                        # Provide safe defaults to satisfy model constraints
                        address_data = {
                            'street': street or '',
                            'barangay': barangay or '',
                            'note': note,
                            'label': label or 'home',
                        }
                        Address.objects.update_or_create(user=user, defaults=address_data)
                except Exception as e:
                    # Do not fail registration if address creation fails; include a warning
                    logger.warning(f"Address creation failed for {email}: {e}")

            # ✅ Send magic link after successful registration
            token = uuid.uuid4()
            expires_at = timezone.now() + timedelta(minutes=15)

            magic_link = MagicLink.objects.create(user=user, token=token, expires_at=expires_at)

            magic_link_url = f"{settings.SITE_URL}/magic-link-login/{token}/"
            send_mail(
                'Your Magic Link for Login',
                f'Click the following link to log in: {magic_link_url}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            return JsonResponse({
                'success': True,
                'message': 'Registered successfully! Magic link has been sent to your email.',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                }
            })

        except Exception as e:
            print(f'Error during registration: {e}')
            return JsonResponse({'error': 'Internal server error'}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def get_restaurants(request):
    if request.method == 'GET':
        try:
            restaurants = Restaurant.objects.filter(is_approved=True)
            restaurants_data = []
            
            # Build absolute URL for media files
            base_url = request.build_absolute_uri('/')[:-1]  # Remove trailing slash
            
            for restaurant in restaurants:
                # Get profile picture URL (Cloudinary URLs are already absolute)
                profile_picture_url = None
                if restaurant.profile_picture:
                    # Check if it's already a full URL (starts with http)
                    pic_url = str(restaurant.profile_picture)
                    if pic_url.startswith('http'):
                        profile_picture_url = pic_url
                    else:
                        # Old local files - build absolute URL
                        profile_picture_url = base_url + restaurant.profile_picture.url
                
                restaurant_data = {
                    'id': restaurant.id,
                    'name': restaurant.name,
                    'address': restaurant.address,
                    'barangay': restaurant.barangay,
                    'street': restaurant.street,
                    'restaurant_type': restaurant.restaurant_type,
                    'phone': restaurant.phone,
                    'profile_picture': profile_picture_url,
                }
                restaurants_data.append(restaurant_data)
            
            return JsonResponse({
                'success': True,
                'restaurants': restaurants_data
            })
            
        except Exception as e:
            print(f'Error fetching restaurants: {e}')
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def get_restaurant_products(request, restaurant_id):
    if request.method == 'GET':
        try:
            from menu.models import Product
            
            products = Product.objects.filter(restaurant_id=restaurant_id)
            products_data = []
            
            # Build absolute URL for media files
            base_url = request.build_absolute_uri('/')[:-1]  # Remove trailing slash
            
            for product in products:
                # Get product picture URL (Cloudinary URLs are already absolute)
                product_picture_url = None
                if product.product_picture:
                    # Check if it's already a full URL (starts with http)
                    pic_url = str(product.product_picture)
                    if pic_url.startswith('http'):
                        product_picture_url = pic_url
                    else:
                        # Old local files - build absolute URL
                        product_picture_url = base_url + product.product_picture.url
                
                product_data = {
                    'id': product.id,
                    'name': product.name,
                    'description': product.description,
                    'price': str(product.price),
                    'product_picture': product_picture_url,
                }
                products_data.append(product_data)
            
            return JsonResponse({
                'success': True,
                'products': products_data
            })
            
        except Exception as e:
            print(f'Error fetching restaurant products: {e}')
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def add_to_cart(request):
    if request.method == 'POST':
        try:
            from menu.models import CartItem, Product
            from users.models import User
            
            # Safely parse JSON body or fall back to form-encoded
            try:
                data = json.loads(request.body or b"{}")
            except Exception:
                data = request.POST.dict()
            
            user_id = data.get('user_id')
            product_id = data.get('product_id')
            quantity = int(data.get('quantity', 1))
            
            if not user_id or not product_id:
                return JsonResponse({'error': 'Missing user_id or product_id'}, status=400)
            
            try:
                user = User.objects.get(id=user_id)
                product = Product.objects.get(id=product_id)
            except (User.DoesNotExist, Product.DoesNotExist):
                return JsonResponse({'error': 'User or product not found'}, status=404)
            
            # Get or create cart item
            cart_item, created = CartItem.objects.get_or_create(
                user=user,
                product=product,
                defaults={'quantity': quantity, 'restaurant': product.restaurant}
            )
            
            if not created:
                # Update quantity if item already exists
                cart_item.quantity += quantity
                cart_item.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Item added to cart',
                'cart_item': {
                    'id': cart_item.id,
                    'product_name': product.name,
                    'quantity': cart_item.quantity,
                    'subtotal': float(cart_item.subtotal())
                }
            })
            
        except Exception as e:
            print(f'Error adding to cart: {e}')
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)


@csrf_exempt
def remove_from_cart(request):
    if request.method == 'POST':
        try:
            from menu.models import CartItem, Product
            from users.models import User
            
            # Safely parse JSON body or fall back to form-encoded
            try:
                data = json.loads(request.body or b"{}")
            except Exception:
                data = request.POST.dict()
            
            user_id = data.get('user_id')
            product_id = data.get('product_id')
            
            if not user_id or not product_id:
                return JsonResponse({'error': 'Missing user_id or product_id'}, status=400)
            
            try:
                user = User.objects.get(id=user_id)
                product = Product.objects.get(id=product_id)
            except (User.DoesNotExist, Product.DoesNotExist):
                return JsonResponse({'error': 'User or product not found'}, status=404)
            
            # Find and delete the cart item
            try:
                cart_item = CartItem.objects.get(user=user, product=product)
                cart_item.delete()
                
                return JsonResponse({
                    'success': True,
                    'message': 'Item removed from cart',
                    'product_name': product.name
                })
                
            except CartItem.DoesNotExist:
                return JsonResponse({'error': 'Item not found in cart'}, status=404)
            
        except Exception as e:
            print(f'Error removing from cart: {e}')
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)


@csrf_exempt
def update_personal_details(request):
    """Update user personal details including phone number"""
    if request.method == 'POST':
        try:
            from customer.models import Customer
            from users.models import User
            
            # Parse JSON data
            try:
                data = json.loads(request.body or b"{}")
            except Exception:
                data = request.POST.dict()
            
            user_id = data.get('user_id')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            phone = data.get('phone')
            
            print(f'Updating personal details for user {user_id}')
            
            # Get user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
            
            # Update user's first and last name
            if first_name:
                user.first_name = first_name
            if last_name:
                user.last_name = last_name
            user.save()
            
            # Update or create customer record with phone number
            if user.role == 'customer' and phone:
                customer, created = Customer.objects.get_or_create(user=user)
                customer.phone = phone
                customer.save()
                print(f'Updated customer phone: {phone}')
            
            return JsonResponse({
                'success': True,
                'message': 'Personal details updated successfully',
                'firstName': user.first_name,
                'lastName': user.last_name,
                'phone': phone,
            })
            
        except Exception as e:
            print(f'Error updating personal details: {e}')
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)


@csrf_exempt
def place_order(request):
    """Place an order from mobile app"""
    if request.method == 'POST':
        try:
            from orders.models import Order, OrderLine
            from menu.models import CartItem, Product
            from restaurant.models import Restaurant
            from users.models import User
            
            # Parse JSON data
            try:
                data = json.loads(request.body or b"{}")
            except Exception:
                data = request.POST.dict()
            
            user_id = data.get('user_id')
            restaurant_id = data.get('restaurant_id')
            payment_method = data.get('payment_method', 'Cash on Delivery')
            total_amount = data.get('total_amount')
            
            print(f'Placing order for user {user_id}, restaurant {restaurant_id}')
            
            # Get user and restaurant
            try:
                customer = User.objects.get(id=user_id, role='customer')
                restaurant = Restaurant.objects.get(id=restaurant_id)
                restaurant_user = restaurant.user
            except (User.DoesNotExist, Restaurant.DoesNotExist) as e:
                return JsonResponse({'success': False, 'error': 'User or restaurant not found'}, status=404)
            
            # Get cart items for this user and restaurant
            cart_items = CartItem.objects.filter(user=customer, restaurant=restaurant)
            
            if not cart_items.exists():
                return JsonResponse({'success': False, 'error': 'No items in cart'}, status=400)
            
            # Create order
            order = Order.objects.create(
                customer=customer,
                restaurant=restaurant_user,
                total_amount=total_amount,
                payment_method=payment_method,
                rider_fee=29.00,  # Fixed rider fee
                small_order_fee=19.00,  # Fixed small order fee
                status='pending'
            )
            
            print(f'Order created with token: {order.token_number}')
            
            # Create order lines from cart items
            for cart_item in cart_items:
                OrderLine.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    subtotal=cart_item.product.price * cart_item.quantity
                )
            
            # Clear cart items after order is placed
            cart_items.delete()
            
            print(f'Order placed successfully: Order #{order.id}, Token: {order.token_number}')
            
            return JsonResponse({
                'success': True,
                'message': 'Order placed successfully',
                'order': {
                    'id': order.id,
                    'token_number': order.token_number,
                    'total_amount': str(order.total_amount),
                    'payment_method': order.payment_method,
                    'status': order.status,
                    'created_at': order.created_at.isoformat(),
                }
            })
            
        except Exception as e:
            print(f'Error placing order: {e}')
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)


# ==========================================
# STRIPE PAYMENT INTEGRATION ENDPOINTS
# ==========================================

# Initialize Stripe with API key from environment
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')


@csrf_exempt
@require_POST
def create_payment_intent(request):
    """
    Create a Stripe Payment Intent
    Endpoint: POST /api/stripe/create-payment-intent/
    """
    try:
        # Parse JSON data
        try:
            data = json.loads(request.body or b"{}")
        except Exception:
            data = request.POST.dict()
        
        user_id = data.get('user_id')
        restaurant_id = data.get('restaurant_id')
        total_amount = float(data.get('total_amount', 0))
        
        if not user_id or not restaurant_id or not total_amount:
            return JsonResponse({
                'success': False,
                'error': 'Missing required fields: user_id, restaurant_id, total_amount'
            }, status=400)
        
        # Verify user and restaurant exist
        try:
            customer = User.objects.get(id=user_id, role='customer')
            restaurant = Restaurant.objects.get(id=restaurant_id)
        except (User.DoesNotExist, Restaurant.DoesNotExist) as e:
            return JsonResponse({
                'success': False,
                'error': 'User or restaurant not found'
            }, status=404)
        
        # Create Payment Intent with Stripe
        # Convert to cents (Stripe uses smallest currency unit)
        amount_in_cents = int(total_amount * 100)
        
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_in_cents,
            currency='php',  # Philippine Peso
            payment_method_types=['card'],
            metadata={
                'user_id': user_id,
                'restaurant_id': restaurant_id,
                'customer_name': f"{customer.first_name} {customer.last_name}",
                'restaurant_name': restaurant.name,
            }
        )
        
        print(f'✅ Payment Intent created: {payment_intent.id}')
        
        return JsonResponse({
            'success': True,
            'client_secret': payment_intent.client_secret,
            'payment_intent_id': payment_intent.id,
        })
        
    except stripe.error.StripeError as e:
        print(f'❌ Stripe error: {str(e)}')
        return JsonResponse({
            'success': False,
            'error': f'Stripe error: {str(e)}'
        }, status=400)
    except Exception as e:
        print(f'❌ Error creating payment intent: {str(e)}')
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_POST
def confirm_payment(request):
    """
    Confirm payment and create order
    Endpoint: POST /api/stripe/confirm-payment/
    """
    try:
        # Parse JSON data
        try:
            data = json.loads(request.body or b"{}")
        except Exception:
            data = request.POST.dict()
        
        payment_intent_id = data.get('payment_intent_id')
        user_id = data.get('user_id')
        restaurant_id = data.get('restaurant_id')
        total_amount = data.get('total_amount')
        payment_method = data.get('payment_method', 'Card Payment')
        
        if not payment_intent_id or not user_id or not restaurant_id or not total_amount:
            return JsonResponse({
                'success': False,
                'error': 'Missing required fields'
            }, status=400)
        
        # Retrieve payment intent from Stripe
        try:
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            return JsonResponse({
                'success': False,
                'error': f'Payment intent not found: {str(e)}'
            }, status=400)
        
        # Check if payment was successful
        if payment_intent.status != 'succeeded':
            return JsonResponse({
                'success': False,
                'error': f'Payment not completed. Status: {payment_intent.status}'
            }, status=400)
        
        # Get user and restaurant
        try:
            customer = User.objects.get(id=user_id, role='customer')
            restaurant = Restaurant.objects.get(id=restaurant_id)
            restaurant_user = restaurant.user
        except (User.DoesNotExist, Restaurant.DoesNotExist) as e:
            return JsonResponse({
                'success': False,
                'error': 'User or restaurant not found'
            }, status=404)
        
        # Get cart items for this user and restaurant
        cart_items = CartItem.objects.filter(user=customer, restaurant=restaurant)
        
        if not cart_items.exists():
            return JsonResponse({
                'success': False,
                'error': 'No items in cart'
            }, status=400)
        
        # Create order with Stripe payment details
        order = Order.objects.create(
            customer=customer,
            restaurant=restaurant_user,
            total_amount=total_amount,
            payment_method=payment_method,
            payment_status='succeeded',
            stripe_payment_intent_id=payment_intent_id,
            stripe_charge_id=payment_intent.latest_charge,
            rider_fee=29.00,
            small_order_fee=19.00,
            status='pending'
        )
        
        print(f'✅ Order created with Stripe payment: Order #{order.id}')
        
        # Create order lines from cart items
        for cart_item in cart_items:
            OrderLine.objects.create(
                order=order,
                product=cart_item.product,
                quantity=cart_item.quantity,
                subtotal=cart_item.product.price * cart_item.quantity
            )
        
        # Clear cart items after successful order
        cart_items.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Payment confirmed and order created successfully',
            'order': {
                'id': order.id,
                'token_number': order.token_number,
                'total_amount': str(order.total_amount),
                'payment_method': order.payment_method,
                'payment_status': order.payment_status,
                'status': order.status,
                'created_at': order.created_at.isoformat(),
            }
        })
        
    except Exception as e:
        print(f'❌ Error confirming payment: {str(e)}')
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    Endpoint: POST /api/stripe/webhook/
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        # Invalid payload
        print('⚠️ Invalid payload in webhook')
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        print('⚠️ Invalid signature in webhook')
        return JsonResponse({'error': 'Invalid signature'}, status=400)
    
    # Handle the event
    print(f'📬 Webhook received: {event["type"]}')
    
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        
        # Update order with payment status
        try:
            order = Order.objects.get(stripe_payment_intent_id=payment_intent_id)
            order.payment_status = 'succeeded'
            order.stripe_charge_id = payment_intent.get('latest_charge')
            order.save()
            print(f'✅ Updated order #{order.id} payment status to succeeded')
        except Order.DoesNotExist:
            print(f'⚠️ Order not found for payment intent: {payment_intent_id}')
    
    elif event['type'] == 'payment_intent.payment_failed':
        payment_intent = event['data']['object']
        payment_intent_id = payment_intent['id']
        
        # Update order with payment status
        try:
            order = Order.objects.get(stripe_payment_intent_id=payment_intent_id)
            order.payment_status = 'failed'
            order.save()
            print(f'❌ Updated order #{order.id} payment status to failed')
        except Order.DoesNotExist:
            print(f'⚠️ Order not found for payment intent: {payment_intent_id}')
    
    return JsonResponse({'success': True})


@csrf_exempt
def get_order_status(request, order_id):
    """Get current order status for tracking"""
    try:
        from orders.models import Order
        
        # Use try_get to safely handle cases where rider might be None
        try:
            order = Order.objects.select_related('rider').get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Order not found'}, status=404)
        
        order_data = {
            'id': order.id,
            'token_number': order.token_number,
            'status': order.status,
            'total_amount': str(order.total_amount),
            'payment_method': order.payment_method,
            'created_at': order.created_at.isoformat(),
        }
        
        # Include assigned rider information if available
        if order.rider:
            order_data['assigned_rider_id'] = order.rider.id
            order_data['assigned_rider_name'] = f"{order.rider.first_name} {order.rider.last_name}"
            print(f'Order {order.id} has assigned rider: {order.rider.id}')
        else:
            print(f'Order {order.id} has no assigned rider yet')
        
        return JsonResponse({
            'success': True,
            'order': order_data
        })
        
    except Exception as e:
        import traceback
        print(f'Error getting order status: {e}')
        print(f'Traceback: {traceback.format_exc()}')
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


@csrf_exempt
def save_address(request):
    """Save or update user address from mobile app"""
    if request.method == 'POST':
        try:
            from customer.models import Address
            from users.models import User
            
            # Parse JSON data
            try:
                data = json.loads(request.body or b"{}")
            except Exception:
                data = request.POST.dict()
            
            user_id = data.get('user_id')
            street = data.get('street')
            barangay = data.get('barangay')
            note = data.get('note', '')
            label = data.get('label', 'home')
            latitude = data.get('latitude')
            longitude = data.get('longitude')
            
            print(f'Saving address for user {user_id}: {street}, {barangay}')
            
            # Get user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
            
            # Create or update address
            address, created = Address.objects.update_or_create(
                user=user,
                defaults={
                    'street': street,
                    'barangay': barangay,
                    'note': note,
                    'label': label,
                    'latitude': latitude,
                    'longitude': longitude,
                }
            )
            
            action = 'created' if created else 'updated'
            print(f'Address {action} for user {user.username}')
            
            return JsonResponse({
                'success': True,
                'message': f'Address {action} successfully',
                'label': address.label,
                'street': address.street,
                'barangay': address.barangay,
                'note': address.note,
                'latitude': latitude,  # Return the latitude/longitude as they were sent
                'longitude': longitude,
            })
            
        except Exception as e:
            print(f'Error saving address: {e}')
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)


@csrf_exempt
def get_user_address(request):
    if request.method == 'POST':
        try:
            from customer.models import Address
            from users.models import User
            
            # Safely parse JSON body or fall back to form-encoded
            try:
                data = json.loads(request.body or b"{}")
            except Exception:
                data = request.POST.dict()
            
            user_id = data.get('user_id')
            username = data.get('username')
            email = data.get('email')
            
            print(f'Getting address - user_id: {user_id}, username: {username}, email: {email}')
            
            # Try to find user by ID, username, or email
            user = None
            
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    print(f'Found user by ID: {user.username} (ID: {user.id})')
                except User.DoesNotExist:
                    print(f'User with ID {user_id} not found, trying other methods...')
            
            if not user and username:
                try:
                    user = User.objects.get(username=username)
                    print(f'Found user by username: {user.username} (ID: {user.id})')
                except User.DoesNotExist:
                    print(f'User with username {username} not found')
            
            if not user and email:
                try:
                    user = User.objects.get(email=email)
                    print(f'Found user by email: {user.username} (ID: {user.id})')
                except User.DoesNotExist:
                    print(f'User with email {email} not found')
            
            if not user:
                print('Could not find user with provided credentials')
                return JsonResponse({'error': 'User not found'}, status=404)
            
            # Get user's address
            try:
                address = Address.objects.get(user=user)
                print(f'Found address for user {user.username}: {address.street}, {address.barangay}')
                
                # Convert Plus Code to coordinates for Google Maps
                # Plus Code format: 6QW667W5+W7R
                latitude = 14.5995  # Default Manila coordinates
                longitude = 120.9842
                
                # Try to decode Plus Code using Google Geocoding API
                if '+' in address.street and len(address.street) > 8:
                    try:
                        import requests
                        from urllib.parse import quote
                        
                        # Use Google Geocoding API to decode Plus Code
                        # Plus Codes can be directly geocoded by Google
                        api_key = 'AIzaSyCCuDLJMhB-23kQiXYpXwi-yYGvKz7OgSQ'  # Your Google Maps API key
                        
                        # URL encode the Plus Code
                        encoded_address = quote(address.street)
                        geocode_url = f'https://maps.googleapis.com/maps/api/geocode/json?address={encoded_address}&key={api_key}'
                        
                        print(f'Geocoding Plus Code: {address.street}')
                        print(f'Geocoding URL: {geocode_url}')
                        
                        response = requests.get(geocode_url, timeout=10)
                        
                        if response.status_code == 200:
                            data = response.json()
                            print(f'Geocoding response: {data}')
                            
                            if data.get('status') == 'OK' and len(data.get('results', [])) > 0:
                                location = data['results'][0]['geometry']['location']
                                latitude = location['lat']
                                longitude = location['lng']
                                print(f'Decoded Plus Code {address.street} to lat: {latitude}, lng: {longitude}')
                            else:
                                print(f'Geocoding returned status: {data.get("status")}')
                                if 'error_message' in data:
                                    print(f'Error message: {data.get("error_message")}')
                        else:
                            print(f'Geocoding API returned status code: {response.status_code}')
                            
                    except Exception as e:
                        print(f'Error decoding Plus Code: {e}')
                        import traceback
                        traceback.print_exc()
                        # Fall back to default coordinates
                        pass
                
                return JsonResponse({
                    'success': True,
                    'address': {
                        'label': address.label,
                        'street': address.street,
                        'barangay': address.barangay,
                        'note': address.note,
                        'latitude': latitude,
                        'longitude': longitude,
                    }
                })
                
            except Address.DoesNotExist:
                print(f'No address found for user {user.username} (ID: {user.id})')
                return JsonResponse({
                    'success': False,
                    'error': 'No address found for user',
                    'message': 'Please add an address first'
                })
            
        except Exception as e:
            import traceback
            print(f'Error fetching address: {e}')
            print(f'Traceback: {traceback.format_exc()}')
            return JsonResponse({'error': f'Internal server error: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)


@csrf_exempt
def get_customer_orders(request):
    """Get all orders for a customer from mobile app"""
    if request.method == 'POST':
        try:
            from orders.models import Order
            from users.models import User
            from restaurant.models import Restaurant
            
            # Parse JSON data
            try:
                data = json.loads(request.body or b"{}")
            except Exception:
                data = request.POST.dict()
            
            user_id = data.get('user_id')
            
            if not user_id:
                return JsonResponse({'success': False, 'error': 'user_id is required'}, status=400)
            
            # Get user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'User not found'}, status=404)
            
            # Get all orders for this customer
            orders = Order.objects.filter(customer=user).order_by('-created_at')
            
            # Separate active and delivered orders
            active_orders = []
            recent_orders = []
            
            for order in orders:
                try:
                    # Get restaurant info
                    restaurant = Restaurant.objects.get(user=order.restaurant)
                    
                    order_data = {
                        'id': order.id,
                        'token_number': order.token_number,
                        'restaurant_name': restaurant.name,
                        'total_amount': str(order.total_amount),
                        'payment_method': order.payment_method,
                        'status': order.status,
                        'created_at': order.created_at.isoformat(),
                    }
                    
                    # Add to appropriate list based on status
                    if order.status not in ['delivered', 'cancelled']:
                        active_orders.append(order_data)
                    else:
                        recent_orders.append(order_data)
                except Exception as e:
                    print(f'Error processing order {order.id}: {e}')
                    continue
            
            return JsonResponse({
                'success': True,
                'active_orders': active_orders,
                'recent_orders': recent_orders,
            })
            
        except Exception as e:
            print(f'Error getting customer orders: {e}')
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)


@csrf_exempt
def search_products_and_restaurants(request):
    """Search for products and restaurants based on query"""
    print('🔍 search_products_and_restaurants called!')
    print(f'🔍 Request method: {request.method}')
    print(f'🔍 Query params: {request.GET.dict()}')
    
    if request.method == 'GET':
        try:
            from menu.models import Product
            from restaurant.models import Restaurant
            from django.db.models import Q
            
            query = request.GET.get('q', '').strip()
            print(f'🔍 Search query: {query}')
            
            if not query:
                return JsonResponse({
                    'success': True,
                    'products': [],
                    'restaurants': []
                })
            
            # Build absolute URL for media files
            base_url = request.build_absolute_uri('/')[:-1]  # Remove trailing slash
            
            # Search restaurants FIRST to filter them out from products
            # Search restaurants (case-insensitive)
            restaurants = Restaurant.objects.filter(
                Q(name__icontains=query) | Q(barangay__icontains=query) | Q(address__icontains=query)
            ).filter(is_approved=True)[:10]  # Limit to 10 results and only approved
            
            # Get restaurant IDs and names that matched the query (to exclude from products)
            matched_restaurant_ids = list(restaurants.values_list('id', flat=True))
            matched_restaurant_names = [name.lower() for name in restaurants.values_list('name', flat=True)]
            print(f'🍽️ Found {len(matched_restaurant_ids)} matching restaurants: {list(restaurants.values_list("name", flat=True))}')
            
            # Search products (case-insensitive) - EXCLUDE products that match only by restaurant name
            products = Product.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            ).select_related('restaurant')
            print(f'📦 Found {products.count()} total products matching query')
            
            # Filter out products where the match was only in the restaurant name
            # (Only keep products that match in their own name or description)
            products_data = []
            for product in products:
                # Check if product name or description matches
                product_name_match = query.lower() in product.name.lower()
                product_description_match = query.lower() in product.description.lower() if product.description else False
                
                # Check if the product name exactly matches a restaurant name (common data issue)
                product_name_is_restaurant = product.name.lower() in matched_restaurant_names
                
                # Exclude product if its name matches a restaurant name
                if product_name_is_restaurant:
                    print(f'🚫 Excluding product (name matches restaurant): {product.name}')
                    continue
                
                # Only include product if it matches in its own fields (not just restaurant name)
                if product_name_match or product_description_match:
                    products_data.append(product)
                    print(f'✅ Including product: {product.name} (matched: name={product_name_match}, desc={product_description_match})')
                else:
                    print(f'❌ Excluding product: {product.name} (restaurant: {product.restaurant.name})')
                
                # Limit to 10 results
                if len(products_data) >= 10:
                    break
            
            # Now build the products data with URLs
            final_products_data = []
            for product in products_data:
                # Get product picture URL (Cloudinary URLs are already absolute)
                product_picture_url = None
                if product.product_picture:
                    pic_url = str(product.product_picture)
                    if pic_url.startswith('http'):
                        product_picture_url = pic_url
                    else:
                        product_picture_url = base_url + product.product_picture.url
                
                final_products_data.append({
                    'id': product.id,
                    'name': product.name,
                    'price': str(product.price),
                    'product_picture': product_picture_url,
                    'restaurant_id': product.restaurant.id,
                    'restaurant_name': product.restaurant.name,
                })
            
            restaurants_data = []
            for restaurant in restaurants:
                # Get profile picture URL (Cloudinary URLs are already absolute)
                profile_picture_url = None
                if restaurant.profile_picture:
                    pic_url = str(restaurant.profile_picture)
                    if pic_url.startswith('http'):
                        profile_picture_url = pic_url
                    else:
                        profile_picture_url = base_url + restaurant.profile_picture.url
                
                restaurants_data.append({
                    'id': restaurant.id,
                    'name': restaurant.name,
                    'address': restaurant.address,
                    'barangay': restaurant.barangay,
                    'profile_picture': profile_picture_url,
                })
            
            print(f'📤 Returning {len(final_products_data)} products and {len(restaurants_data)} restaurants')
            
            return JsonResponse({
                'success': True,
                'products': final_products_data,
                'restaurants': restaurants_data
            })
            
        except Exception as e:
            print(f'Error searching products and restaurants: {e}')
            import traceback
            traceback.print_exc()
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'}, status=400)
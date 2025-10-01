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
from menu.models import Product
from django.views.decorators.csrf import csrf_exempt
from restaurant.models import Restaurant


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
        send_mail(
            'Your Magic Link for Login',
            f'Click the following link to log in: {magic_link_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return JsonResponse({'message': 'Magic link sent successfully! Click the link to securely log in.'})


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

        print(f"DEBUG: Received login attempt - Email: {email}, Password: {password}")

        try:
            user = User.objects.get(email=email)
            print(f"DEBUG: Found user with username: {user.username}")
        except User.DoesNotExist:
            print("DEBUG: No user found with that email.")
            return JsonResponse({'success': False, 'error': 'Invalid email or password'})

        user = authenticate(request, username=user.username, password=password)
        print(f"DEBUG: authenticate() result: {user}")

        if user is not None:
            login(request, user)
            if user.role == 'customer':
                return JsonResponse({'success': True, 'redirect_url': reverse('core:customer_home')})
            elif user.role == 'restaurant':
                return JsonResponse({'success': True, 'redirect_url': reverse('core:restaurant_home')})
            elif user.role == 'rider':
                return JsonResponse({'success': True, 'redirect_url': reverse('core:rider_home')})
            elif user.role == 'demo':
                return JsonResponse({'success': True, 'redirect_url': reverse('demo:dashboard')})
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

            # If address details were provided, create/update Address linked to this user
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
                # Build absolute URL for profile picture
                profile_picture_url = None
                if restaurant.profile_picture:
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
                # Build absolute URL for product picture
                product_picture_url = None
                if product.product_picture:
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
            
            print(f'🔍 Getting address for user_id: {user_id}')
            
            if not user_id:
                print('❌ No user_id provided')
                return JsonResponse({'error': 'Missing user_id'}, status=400)
            
            try:
                user = User.objects.get(id=user_id)
                print(f'✅ Found user: {user.username} (ID: {user.id})')
            except User.DoesNotExist:
                print(f'❌ User with ID {user_id} not found')
                return JsonResponse({'error': 'User not found'}, status=404)
            
            # Get user's address
            try:
                address = Address.objects.get(user=user)
                print(f'✅ Found address for user {user.username}: {address.street}, {address.barangay}')
                
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
                        
                        print(f'🔍 Geocoding Plus Code: {address.street}')
                        print(f'📍 Geocoding URL: {geocode_url}')
                        
                        response = requests.get(geocode_url, timeout=10)
                        
                        if response.status_code == 200:
                            data = response.json()
                            print(f'📦 Geocoding response: {data}')
                            
                            if data.get('status') == 'OK' and len(data.get('results', [])) > 0:
                                location = data['results'][0]['geometry']['location']
                                latitude = location['lat']
                                longitude = location['lng']
                                print(f'✅ Decoded Plus Code {address.street} to lat: {latitude}, lng: {longitude}')
                            else:
                                print(f'⚠️ Geocoding returned status: {data.get("status")}')
                                if 'error_message' in data:
                                    print(f'⚠️ Error message: {data.get("error_message")}')
                        else:
                            print(f'⚠️ Geocoding API returned status code: {response.status_code}')
                            
                    except Exception as e:
                        print(f'❌ Error decoding Plus Code: {e}')
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
                return JsonResponse({
                    'success': False,
                    'error': 'No address found for user',
                    'message': 'Please add an address first'
                })
            
        except Exception as e:
            print(f'Error fetching address: {e}')
            return JsonResponse({'error': 'Internal server error'}, status=500)
    
    return JsonResponse({'error': 'Invalid request'}, status=400)
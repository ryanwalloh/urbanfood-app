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
        else:
            return HttpResponse('Unknown role')

    except MagicLink.DoesNotExist:
        return HttpResponse('Invalid magic link')
    

def admin_dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('core:login')

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

    context = {
        'total_orders': total_orders,
        'restaurant_data': restaurant_data,
    }

    return render(request, 'custom_admin/dashboard.html', context)

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
            elif user.role == 'admin':
                return JsonResponse({'success': True, 'redirect_url': reverse('custom_admin:dashboard')})
            else:
                return JsonResponse({'success': False, 'error': 'Unknown role'})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid email or password'})

    return JsonResponse({'success': False, 'error': 'Invalid request'})


def register_account(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('first_name')
            last_name = data.get('last_name')
            role = data.get('role')

            if get_user_model().objects.filter(email=email).exists():
                return JsonResponse({'error': 'Email already registered'}, status=400)

            user = get_user_model().objects.create(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                role=role,
                password=make_password(password)
            )

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
                'message': 'Registered successfully! Magic link has been sent to your email.'
            })

        except Exception as e:
            print(f'Error during registration: {e}')
            return JsonResponse({'error': 'Internal server error'}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)
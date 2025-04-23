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

def landing_page(request):
    return render(request, 'core/landing_page.html')

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

        return JsonResponse({'message': 'Magic link sent successfully! newline: '})

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
            return redirect('customer-home')  # This would map to main.html
        elif user.role == 'restaurant':
            return redirect('restaurant-home')  # restaurant.html
        elif user.role == 'rider':
            return redirect('rider-home')  # rider.html
        else:
            return HttpResponse('Unknown role')

    except MagicLink.DoesNotExist:
        return HttpResponse('Invalid magic link')
    

def customer_home(request):
    return render(request, 'customer/main.html')

def restaurant_home(request):
    return render(request, 'restaurant/restaurant.html')

def rider_home(request):
    return render(request, 'rider/rider.html')
from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import MagicLink
import uuid

def landing_page(request):
    return render(request, 'core/landing_page.html')

def request_magic_link(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return render(request, 'core/request_magic_link.html', {'error': 'Email not found'})

        # Generate the magic link token and expiration time
        token = uuid.uuid4()
        expires_at = timezone.now() + timedelta(minutes=15)  # Token expires in 15 minutes

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

        return render(request, 'core/request_magic_link.html', {'message': 'Check your email for the magic link.'})

    return render(request, 'core/request_magic_link.html')

def magic_link_login(request, token):
    try:
        magic_link = MagicLink.objects.get(token=token)
    except MagicLink.DoesNotExist:
        return render(request, 'core/magic_link_error.html', {'error': 'Invalid or expired magic link.'})

    # Check if the magic link has expired
    if magic_link.is_expired():
        return render(request, 'core/magic_link_error.html', {'error': 'This magic link has expired.'})

    # Log the user in
    login(request, magic_link.user)
    
    # Redirect to the user's home page (or wherever you want)
    return redirect('home')  # Update with the actual name of your homepage view
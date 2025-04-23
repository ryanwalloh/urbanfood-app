from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from .models import MagicLink
import uuid

def landing_page(request):
    return render(request, 'core/landing_page.html')
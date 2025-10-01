#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'soti_delivery.settings')
django.setup()

from rider.models import Rider
from users.models import User

# Check for Rider record
user = User.objects.get(email='mark@gmail.com')
print(f'User found: {user.email}')

try:
    rider = Rider.objects.get(user=user)
    print(f'Rider found: {rider}')
    print(f'Vehicle: {rider.vehicle_type}')
    print(f'License: {rider.license_number}')
    print(f'Phone: {rider.phone}')
    print(f'Available: {rider.is_available}')
except Rider.DoesNotExist:
    print('No Rider record found for mark@gmail.com')
    print('Creating a Rider record...')
    rider = Rider.objects.create(
        user=user,
        vehicle_type='Motorcycle',
        license_number='MC123456789',
        phone='+639123456789',
        is_available=True
    )
    print(f'Created Rider: {rider}')

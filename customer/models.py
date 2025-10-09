# customer/models.py
from django.conf import settings
from django.db import models

class Customer(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    address = models.TextField()
    phone = models.CharField(max_length=15)

    def __str__(self):
        return self.user.username
    

class Address(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    street = models.CharField(max_length=255)
    barangay = models.CharField(max_length=255)
    note = models.CharField(max_length=255, blank=True, null=True)
    label = models.CharField(max_length=50, choices=[('home', 'Home'), ('work', 'Work'), ('partner', 'Partner'), ('other', 'Other')])
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)

    def __str__(self):
        return f'{self.street}, {self.barangay}'
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
    street = models.CharField(max_length=255, null=True, blank=True, default=None)
    barangay = models.CharField(max_length=255, null=True, blank=True, default=None)
    note = models.CharField(max_length=255, null=True, blank=True, default=None)
    label = models.CharField(max_length=100, null=True, blank=True, default=None)
    # other fields...

    def __str__(self):
        return f"{self.user}'s address"
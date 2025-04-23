# rider/models.py
from django.contrib.auth.models import User
from django.db import models

class Rider(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    vehicle_type = models.CharField(max_length=30)
    license_number = models.CharField(max_length=50)
    phone = models.CharField(max_length=15)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.user.username
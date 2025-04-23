# restaurant/models.py
from django.conf import settings
from django.db import models

class Restaurant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    address = models.TextField()
    phone = models.CharField(max_length=15)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.name
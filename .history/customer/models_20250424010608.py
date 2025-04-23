# customer/models.py
from django.conf import settings
from django.db import models

class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    address = models.TextField()
    phone = models.CharField(max_length=15)

    def __str__(self):
        return self.user.username
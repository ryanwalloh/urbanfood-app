from django.db import models
from django.utils import timezone
import random
import string

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('restaurant', 'Restaurant'),
        ('rider', 'Rider'),
        ('admin', 'Admin'),
        ('demo', 'Demo'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    is_phone_verified = models.BooleanField(default=False)
    
    @property
    def name(self):
        return self.get_full_name()

class SMSVerification(models.Model):
    phone_number = models.CharField(max_length=20)
    code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=5)
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_code():
        return ''.join(random.choices(string.digits, k=5))
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def can_attempt_verification(self):
        return self.attempts < 3 and not self.is_expired()
    
    def __str__(self):
        return f"SMS Verification for {self.phone_number} - {self.code}"
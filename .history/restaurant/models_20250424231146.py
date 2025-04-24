from django.conf import settings
from django.db import models

class Restaurant(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    address = models.TextField()
    baranggay = models.CharField(max_length=100, default='Marawi')
restaurant_type = models.CharField(max_length=100, default='Fast Food')
    profile_picture = models.ImageField(upload_to='restaurant_profiles/', blank=True, null=True)  # Added
    phone = models.CharField(max_length=15)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.name
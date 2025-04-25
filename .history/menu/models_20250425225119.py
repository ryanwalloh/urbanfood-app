from django.db import models
from restaurant.models import Restaurant  # Import the Restaurant model

class Product(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image_url = models.URLField(blank=True)
    product_picture = models.ImageField(upload_to='restaurant_profiles/', blank=True, null=True)  # Added

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"

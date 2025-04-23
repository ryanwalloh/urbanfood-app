from django.db import models
from users.models import User

class Product(models.Model):
    restaurant = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'restaurant'})
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image_url = models.URLField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.restaurant.username})"
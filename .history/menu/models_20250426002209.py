from django.db import models
from restaurant.models import Restaurant  # Import the Restaurant model
from django.conf import settings

class Product(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    product_picture = models.ImageField(upload_to='restaurant_products/', blank=True, null=True)  # Added

    def __str__(self):
        return f"{self.name} ({self.restaurant.name})"


class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')

    def subtotal(self):
        return self.quantity * self.product.price
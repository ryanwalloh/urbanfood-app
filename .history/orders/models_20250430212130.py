from django.db import models
from users.models import User
from menu.models import Product

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('preparing', 'Preparing'),
        ('assigned', 'Assigned'),
        ('ready', 'Ready'),
        ('otw', 'On the Way'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_orders', limit_choices_to={'role': 'customer'})
    restaurant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='restaurant_orders', limit_choices_to={'role': 'restaurant'})
    rider = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='rider_orders', limit_choices_to={'role': 'rider'})
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    rider_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    small_order_fee = models.DecimalField(max_digits=6, decimal_places=2, default=29)
    payment_method = models.CharField(max_length=50, default='COD')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

class OrderLine(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=8, decimal_places=2, editable=False)

    def save(self, *args, **kwargs):
        self.subtotal = self.product.price * self.quantity  # Assuming `price` exists on the `Product` model
        super().save(*args, **kwargs)
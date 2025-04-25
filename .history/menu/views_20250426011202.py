from django.shortcuts import render
from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
from django.shortcuts import redirect, get_object_or_404
from .models import Product, CartItem
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

from django.contrib.auth.decorators import login_required

@login_required
def add_to_cart_json(request):
    if request.method == "POST":
        product_id = request.POST.get('product_id')
        quantity = int(request.POST.get('quantity', 1))  # Default to 1 if not provided
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return JsonResponse({"error": "Product not found"}, status=404)
        
        # Check if the cart item already exists for the user
        cart_item, created = CartItem.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:  # If the item already exists, just update the quantity
            cart_item.quantity += quantity
            cart_item.save()

        # Return the updated cart and subtotal
        cart_items = CartItem.objects.filter(user=request.user)
        subtotal = sum(item.subtotal() for item in cart_items)

        # You can return any additional data you want here
        return JsonResponse({
            'cart_items': [item.product.name for item in cart_items],
            'subtotal': subtotal,
            'total_quantity': sum(item.quantity for item in cart_items),
        })

    return JsonResponse({"error": "Invalid request method"}, status=400)
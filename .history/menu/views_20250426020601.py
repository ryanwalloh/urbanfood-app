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

@csrf_exempt
def add_to_cart_json(request):
    if request.method == "POST" and request.user.is_authenticated:
        data = json.loads(request.body)
        product_id = data['product_id']
        product = get_object_or_404(Product, id=product_id)
        restaurant = product.restaurant  # Assumes Product has a ForeignKey to Restaurant

        # Check if item already exists in DB cart
        cart_item, created = CartItem.objects.get_or_create(
            user=request.user,
            product=product,
            restaurant=restaurant,
            defaults={'quantity': 1}
        )

        if not created:
            cart_item.quantity += 1
            cart_item.save()

        # Fetch all cart items for that user & restaurant
        cart_items = CartItem.objects.filter(user=request.user, restaurant=restaurant).select_related('product')

        cart_data = [{
            'product_id': item.product.id,
            'name': item.product.name,
            'price': str(item.product.price),
            'quantity': item.quantity,
            'image': item.product.image.url, 
        } for item in cart_items]

        subtotal = sum(item.product.price * item.quantity for item in cart_items)
        total_quantity = sum(item.quantity for item in cart_items)

        return JsonResponse({
            'items': cart_data,
            'subtotal': float(subtotal),
            'total': float(subtotal + 39),
            'total_quantity': total_quantity,
        })
    
    return JsonResponse({'error': 'Unauthorized or invalid method'}, status=400)
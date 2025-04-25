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
    if request.method == "POST":
        data = json.loads(request.body)  # Deserialize the incoming JSON data
        product_id = data['product_id']
        product = get_object_or_404(Product, id=product_id)

        # Get cart from session
        cart = request.session.get('cart', [])

        # Add product to cart or update quantity
        item = next((item for item in cart if item['product_id'] == product_id), None)
        if item:
            item['quantity'] += 1
        else:
            cart.append({
                'product_id': product.id,
                'name': product.name,
                'price': str(product.price),  # Store as string to avoid Decimal serialization issues
                'quantity': 1,
                'image': product.product_picture.url if product.product_picture else '/static/default-product.jpg'
            })

        # Save cart back to session
        request.session['cart'] = cart

        # Return updated cart data
        return JsonResponse({
            'items': cart,
            'subtotal': sum(float(item['price']) * item['quantity'] for item in cart),  # Ensure price is treated as a float
            'total': sum(float(item['price']) * item['quantity'] for item in cart) + 39,  # Delivery fee
            'total_quantity': sum(item['quantity'] for item in cart),
        })

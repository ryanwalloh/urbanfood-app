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

@login_required  # Ensures the user is logged in before accessing the cart
@require_POST
@csrf_exempt
def add_to_cart_json(request):
    data = json.loads(request.body)
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)  # Default to 1 if quantity isn't provided

    # Fetch the product
    product = get_object_or_404(Product, id=product_id)

    # Check if the user already has the product in their cart
    cart_item, created = CartItem.objects.get_or_create(
        user=request.user,
        product=product,
        defaults={'quantity': quantity}  # Set initial quantity if creating a new cart item
    )

    # If the cart item exists, update the quantity
    if not created:
        cart_item.quantity += quantity
        cart_item.save()

    # Get updated cart details
    cart_items = CartItem.objects.filter(user=request.user)
    subtotal = sum(item.subtotal() for item in cart_items)
    total_quantity = sum(item.quantity for item in cart_items)
    total = subtotal + 39  # Fixed delivery fee

    return JsonResponse({
        "items": [
            {
                "id": item.product.id,
                "name": item.product.name,
                "price": item.product.price,
                "image": item.product.product_picture.url if item.product.product_picture else '/static/default-product.jpg',
                "quantity": item.quantity
            } for item in cart_items
        ],
        "subtotal": subtotal,
        "total": total,
        "total_quantity": total_quantity
    })

@login_required
def sync_cart_with_session(request):
    # Get cart items from the database for the logged-in user
    cart_items = CartItem.objects.filter(user=request.user)

    # If there are items in the database, sync with the session cart
    session_cart = request.session.get('cart', {})

    for item in cart_items:
        if str(item.product.id) not in session_cart:
            session_cart[str(item.product.id)] = {
                'name': item.product.name,
                'price': item.product.price,
                'image': item.product.product_picture.url if item.product.product_picture else '/static/default-product.jpg',
                'quantity': item.quantity
            }

    request.session['cart'] = session_cart
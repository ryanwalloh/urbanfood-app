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

@require_POST
@csrf_exempt
def add_to_cart_json(request):
    data = json.loads(request.body)
    product_id = data.get("product_id")
    
    # Fetch product
    product = get_object_or_404(Product, id=product_id)

    # Get session cart
    cart = request.session.get('cart', {})

    if str(product_id) in cart:
        cart[str(product_id)]["quantity"] += 1
        # Update the CartItem in the database
        CartItem.objects.filter(user=request.user, product=product).update(
            quantity=cart[str(product_id)]["quantity"]
        )
    else:
        cart[str(product_id)] = {
            "name": product.name,
            "price": float(product.price),
            "image": product.product_picture.url if product.product_picture else '/static/default-product.jpg',
            "quantity": 1
        }
        # Add new CartItem to the database
        CartItem.objects.create(
            user=request.user,
            product=product,
            quantity=1
        )

    request.session['cart'] = cart

    subtotal = sum(item["price"] * item["quantity"] for item in cart.values())
    total_quantity = sum(item["quantity"] for item in cart.values())
    total = subtotal + 39  # fixed delivery fee

    return JsonResponse({
        "items": [
            {
                "id": pid,
                "name": item["name"],
                "price": item["price"],
                "image": item["image"],
                "quantity": item["quantity"]
            } for pid, item in cart.items()
        ],
        "subtotal": subtotal,
        "total": total,
        "total_quantity": total_quantity
    })

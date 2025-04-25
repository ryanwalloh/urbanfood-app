# restaurant/views.py

from django.shortcuts import render, get_object_or_404, redirect
from menu.models import Product  # Import Product from the menu app
from .models import Restaurant  # Import Restaurant from the restaurant app
from django.contrib.auth.decorators import login_required
from menu.models import CartItem

def sync_cart_with_session(request):
    # Get cart items from the database for the logged-in user
    cart_items = CartItem.objects.filter(user=request.user)

    # If there are items in the database, sync with the session cart
    session_cart = request.session.get('cart', {})

    for item in cart_items:
        if str(item.product.id) not in session_cart:
            session_cart[str(item.product.id)] = {
                'name': item.product.name,
                'price': float(item.product.price),  # Convert Decimal to float
                'image': item.product.product_picture.url if item.product.product_picture else '/static/default-product.jpg',
                'quantity': item.quantity
            }

    request.session['cart'] = session_cart
    
def restaurant_detail(request, pk):
    restaurant = get_object_or_404(Restaurant, pk=pk)
    products = Product.objects.filter(restaurant=restaurant)

    cart_items = []
    subtotal = 0

    if request.user.is_authenticated:
        cart_items_qs = CartItem.objects.filter(user=request.user, product__restaurant=restaurant)

        for item in cart_items_qs:
            cart_items.append({
                'name': item.product.name,
                'price': float(item.product.price),
                'image': item.product.image.url if item.product.image else '',
                'quantity': item.quantity,
            })
        subtotal = sum(item['price'] * item['quantity'] for item in cart_items)

    context = {
        'restaurant': restaurant,
        'products': products,
        'cart_items': cart_items,
        'subtotal': subtotal,
    }

    return render(request, 'restaurant/restaurant_detail.html', context)
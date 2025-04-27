# restaurant/views.py

from django.shortcuts import render, get_object_or_404, redirect
from menu.models import Product  # Import Product from the menu app
from .models import Restaurant  # Import Restaurant from the restaurant app
from django.contrib.auth.decorators import login_required
from menu.models import CartItem

def cart_view(request):
    session_cart = request.session.get('cart', {})

    cart_items = []
    for product_id, quantity in session_cart.items():
        try:
            product = Product.objects.get(id=product_id)
            cart_items.append({
                'product': product,
                'quantity': quantity,
            })
        except Product.DoesNotExist:
            continue  # just skip if product doesn't exist anymore

    context = {
        'cart_items': cart_items,
    }
    return render(request, 'cart.html', context)

def sync_cart_with_session(request):
    cart_items = CartItem.objects.filter(user=request.user)

    session_cart = request.session.get('cart', {})

    for item in cart_items:
        if str(item.product.id) not in session_cart:
            # Check if product has an uploaded picture
            if item.product.product_picture and hasattr(item.product.product_picture, 'url'):
                image_url = item.product.product_picture.url
            else:
                image_url = '/static/default-product.jpg'  # your fallback image
            
            session_cart[str(item.product.id)] = {
                'name': item.product.name,
                'price': float(item.product.price),
                'image': image_url,
                'quantity': item.quantity
            }

    request.session['cart'] = session_cart
    
def restaurant_detail(request, restaurant_id):
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    products = Product.objects.filter(restaurant=restaurant)

    cart_items = []
    subtotal = 0
    total_quantity = 0

    if request.user.is_authenticated:
        cart_items = CartItem.objects.filter(user=request.user, restaurant=restaurant).select_related('product')
        subtotal = sum(item.subtotal() for item in cart_items)
        total_quantity = sum(item.quantity for item in cart_items)
    
    total = subtotal + 39  # Assuming a fixed delivery fee of 39

    return render(request, 'restaurant/storefront.html', {
        'restaurant': restaurant,
        'products': products,
        'cart_items': cart_items,
        'subtotal': subtotal,
        'total': total,
        'total_quantity': total_quantity,
    })
    
@login_required
def checkout_summary(request):
    # Assuming the order summary is for a single restaurant (could be extended for multiple restaurants in cart)
    restaurant_id = request.POST.get('restaurant_id')  # Get the restaurant
    cart_items = CartItem.objects.filter(user=request.user, restaurant=restaurant).select_related('product')

    # Calculate subtotal, total quantity, and total cost
    subtotal = sum(item.product.price * item.quantity for item in cart_items)
    total_quantity = sum(item.quantity for item in cart_items)
    total = subtotal + 39  # Assuming a fixed delivery fee of 39 (or can be dynamically calculated)

    context = {
        'restaurant': restaurant,
        'cart_items': cart_items,
        'subtotal': subtotal,
        'total': total,
        'total_quantity': total_quantity,
    }

    return render(request, 'customer/checkout.html', context)
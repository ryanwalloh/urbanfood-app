# restaurant/views.py

from django.shortcuts import render, get_object_or_404
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
    
def restaurant_detail(request, restaurant_id):
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)

    # Load cart from session
    cart_data = request.session.get('cart', {})
    cart_items = list(cart_data.values())
    print("CART ITEMS TYPE:", type(cart_items))

    # Debug print to check the structure of cart_items
    print(cart_items)

    products = Product.objects.filter(restaurant=restaurant)
    # Calculate subtotal, total, and quantity if necessary
    
    subtotal = sum(item['price'] * item['quantity'] for item in cart_items)
    total = subtotal + 39  # Assuming a fixed delivery fee of 39
    total_quantity = sum(item['quantity'] for item in cart_items)

    return render(request, 'restaurant/storefront.html', {
        'restaurant': restaurant,
        'products': products,
        'cart_items': cart_items,
        'subtotal': subtotal,
        'total': total,
        'total_quantity': total_quantity,
    })

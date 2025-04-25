# restaurant/views.py

from django.shortcuts import render, get_object_or_404
from menu.models import Product  # Import Product from the menu app
from .models import Restaurant  # Import Restaurant from the restaurant app
from django.contrib.auth.decorators import login_required
from menu.models import CartItem

# Define sync_cart_with_session function here
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
    
def restaurant_detail(request, restaurant_id):
    
    sync_cart_with_session(request)


    # Fetch the restaurant based on the provided restaurant_id, if it doesn't exist return a 404 error
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    
    # Fetch products that belong to the given restaurant
    products = Product.objects.filter(restaurant=restaurant)
    
    # Render the restaurant detail page with the fetched restaurant and products
    return render(request, 'restaurant/storefront.html', {
        'restaurant': restaurant,
        'products': products,
    })
    

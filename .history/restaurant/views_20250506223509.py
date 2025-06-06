# restaurant/views.py

from django.shortcuts import render, get_object_or_404, redirect
from menu.models import Product  # Import Product from the menu app
from .models import Restaurant  # Import Restaurant from the restaurant app
from django.contrib.auth.decorators import login_required
from menu.models import CartItem
from orders.models import Order
from django.contrib import messages
from django.core import serializers
from django.http import JsonResponse


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
    
    request.session['restaurant_id'] = restaurant.id

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
def dashboard(request):
    # Only fetch orders for the logged-in restaurant user
    new_orders = Order.objects.filter(status='pending', restaurant=request.user)
    return render(request, 'restaurant/dashboard.html', {
        'new_orders': new_orders,
    })

@login_required
def accept_order(request, order_id):
    order = get_object_or_404(Order, id=order_id, restaurant=request.user)
    if request.method == 'POST':
        order.status = 'accepted'
        order.save()
        messages.success(request, f"Order #{order.id} has been accepted.")
    return redirect('restaurant:dashboard')

@login_required
def reject_order(request, order_id):
    order = get_object_or_404(Order, id=order_id, restaurant=request.user)
    if request.method == 'POST':
        order.status = 'cancelled'
        order.save()
        messages.error(request, f"Order #{order.id} has been rejected.")
    return redirect('restaurant:dashboard')



@login_required
def restaurant_dashboard(request):
    if request.user.role != 'restaurant':
        return redirect('core:landing_page')

    try:
        restaurant = request.user.restaurant
    except:
        restaurant = None

    pending_orders = Order.objects.filter(
        restaurant=request.user,
        status='pending'
    ).order_by('-created_at').prefetch_related('items__product', 'customer')

    preparing_orders = Order.objects.filter(
        restaurant=request.user,
        status='preparing'
    ).order_by('-created_at').prefetch_related('items__product', 'customer')

    ready_orders = Order.objects.filter(
        restaurant=request.user,
        status='ready'
    ).order_by('-created_at').prefetch_related('items__product', 'customer')

    return render(request, 'restaurant/dashboard.html', {
        'restaurant': restaurant,
        'pending_orders': pending_orders,
        'preparing_orders': preparing_orders,
        'ready_orders': ready_orders,
    })
    
@login_required
def get_pending_orders(request):
    if request.user.role != 'restaurant':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    orders = Order.objects.filter(restaurant=request.user, status='pending').order_by('-created_at')
    
    data = []
    for order in orders:
        items = [{'name': item.product.name, 'quantity': item.quantity} for item in order.items.all()]
        data.append({
            'id': order.id,
            'token_number': order.token_number,
            'customer_name': order.customer.get_full_name(),
            'customer_address': order.customer.address,
            'created_at': order.created_at.strftime('%I:%M %p'),
            'total_amount': str(order.total_amount),
            'rider_name': order.rider.get_full_name() if order.rider else 'Not Assigned',
            'rider_phone': order.rider.phone if order.rider else 'N/A',
            'items': items
        })

    return JsonResponse({'orders': data})
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
from .serializers import OrderSerializer
from rest_framework.response import Response
from rest_framework.decorators import api_view
from menu.forms import ProductForm
from menu.models import Product

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
    # Get restaurant profile
    from restaurant.models import Restaurant
    
    try:
        restaurant = Restaurant.objects.get(user=request.user)
        print(f"DEBUG: Found restaurant: {restaurant.name}")
        print(f"DEBUG: Profile picture field: {restaurant.profile_picture}")
    except Restaurant.DoesNotExist:
        print(f"DEBUG: No Restaurant record found for user: {request.user.username} (ID: {request.user.id})")
        # Create a temporary restaurant object for the template
        restaurant = type('obj', (object,), {'name': request.user.username, 'profile_picture': None})()
        restaurant_profile_url = ''
        pending_orders = Order.objects.filter(status='pending', restaurant=request.user).order_by('-created_at')
        preparing_orders = Order.objects.filter(status='preparing', restaurant=request.user).order_by('-created_at')
        ready_orders = Order.objects.filter(status='ready', restaurant=request.user).order_by('-created_at')
        
        return render(request, 'restaurant/dashboard.html', {
            'restaurant': restaurant,
            'restaurant_profile_url': restaurant_profile_url,
            'pending_orders': pending_orders,
            'preparing_orders': preparing_orders,
            'ready_orders': ready_orders,
        })
    
    # Get profile picture URL (handle Cloudinary)
    restaurant_profile_url = ''
    if restaurant.profile_picture:
        pic_url = str(restaurant.profile_picture)
        print(f"DEBUG: Profile picture URL: {pic_url}")
        if pic_url.startswith('http'):
            restaurant_profile_url = pic_url
        else:
            restaurant_profile_url = request.build_absolute_uri(restaurant.profile_picture.url)
        print(f"DEBUG: Final restaurant_profile_url: {restaurant_profile_url}")
    else:
        print("DEBUG: No profile picture set for this restaurant")
    
    # Fetch orders for the logged-in restaurant user
    pending_orders = Order.objects.filter(status='pending', restaurant=request.user).order_by('-created_at')
    preparing_orders = Order.objects.filter(status='preparing', restaurant=request.user).order_by('-created_at')
    ready_orders = Order.objects.filter(status='ready', restaurant=request.user).order_by('-created_at')
    
    return render(request, 'restaurant/dashboard.html', {
        'restaurant': restaurant,
        'restaurant_profile_url': restaurant_profile_url,
        'pending_orders': pending_orders,
        'preparing_orders': preparing_orders,
        'ready_orders': ready_orders,
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
def prepare_order(request):
    if request.method == 'POST':
        order_id = request.POST.get('order_id')
        try:
            order = Order.objects.get(id=order_id, restaurant=request.user)
            order.status = 'preparing'
            order.save()
            return JsonResponse({'success': True, 'message': 'Order is now being prepared!'})
        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Order not found.'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    return JsonResponse({'success': False, 'message': 'Invalid request method.'})





@login_required
def restaurant_dashboard(request):
    if request.user.role != 'restaurant':
        return redirect('core:landing_page')

    try:
        restaurant = request.user.restaurant
    except:
        restaurant = None

    # Include 'assigned' orders along with 'pending'
    pending_orders = Order.objects.filter(
        restaurant=request.user,
        status__in=['pending', 'assigned']
    ).order_by('-created_at').prefetch_related('items__product', 'customer').select_related('rider')

    preparing_orders = Order.objects.filter(
        restaurant=request.user,
        status__in=['preparing', 'assigned']
    ).order_by('-created_at').prefetch_related('items__product', 'customer').select_related('rider')

    ready_orders = Order.objects.filter(
        restaurant=request.user,
        status='ready'
    ).order_by('-created_at').prefetch_related('items__product', 'customer').select_related('rider')

    return render(request, 'restaurant/dashboard.html', {
        'restaurant': restaurant,
        'pending_orders': pending_orders,
        'preparing_orders': preparing_orders,
        'ready_orders': ready_orders,
    })


    
@api_view(['GET'])
def get_pending_orders(request):
    if request.user.role != 'restaurant':
        return Response({'error': 'Unauthorized'}, status=403)

    # Allow orders that are either 'pending' or 'assigned'
    orders = Order.objects.filter(
        restaurant=request.user,
        status__in=['pending']
    ).order_by('-created_at')

    serializer = OrderSerializer(orders, many=True)
    return Response({'orders': serializer.data})

def add_product(request):
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save(commit=False)
            product.restaurant = request.user.restaurant
            product.save()
            return redirect('restaurant:dashboard')  # Update with your actual dashboard route
    return redirect('restaurant:dashboard')  
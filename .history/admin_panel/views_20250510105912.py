from django.shortcuts import render, redirect
from restaurant.models import Restaurant
from rider.models import Rider
from customer.models import Customer
from menu.models import Product
from orders.models import Order
from users.models import User

def dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('core:login')

    restaurants = Restaurant.objects.all()

    # Count total orders
    total_orders = Order.objects.count()

    # Annotate each restaurant with its related order count
    restaurant_data = []
    for restaurant in restaurants:
        order_count = Order.objects.filter(restaurant=restaurant.user).count()
        restaurant_data.append({
            'name': restaurant.name,
            'profile_picture': restaurant.profile_picture.url if restaurant.profile_picture else '/static/default.png',
            'order_count': order_count,
        })

    context = {
        'total_orders': total_orders,
        'restaurant_data': restaurant_data,
    }
    return render(request, 'admin_panel/dashboard.html', context)

from django.shortcuts import render
from orders.models import Order

def pending_orders_view(request):
    # For now, let's show all pending orders across all restaurants
    pending_orders = Order.objects.filter(status='pending').select_related('restaurant', 'customer')
    
    return render(request, 'admin_panel/dashboard.html', {
        'pending_orders': pending_orders
    })

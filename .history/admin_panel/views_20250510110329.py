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
    pending_orders = Order.objects.filter(status='pending').select_related('restaurant', 'customer')

    order_data = []
    for order in pending_orders:
        items = order.orderline_set.select_related('product').all()
        order_data.append({
            'id': order.id,
            'token_number': order.token_number,
            'created_at': order.created_at.isoformat(),
            'customer_name': order.customer.name if order.customer else 'Unknown',
            'customer_address': {
                'barangay': order.customer.address.barangay if hasattr(order.customer, 'address') else '',
            },
            'restaurant_profile': order.restaurant.restaurant.profile_picture.url if hasattr(order.restaurant, 'restaurant') and order.restaurant.restaurant.profile_picture else '/static/default.png',
            'total_amount': str(order.total_amount),
            'items': [{
                'product': {
                    'name': item.product.name
                },
                'quantity': item.quantity
            } for item in items]
        })

    return JsonResponse({'orders': order_data})
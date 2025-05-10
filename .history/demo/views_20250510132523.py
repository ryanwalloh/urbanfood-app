from django.shortcuts import render, redirect
from restaurant.models import Restaurant
from rider.models import Rider
from customer.models import Customer
from menu.models import Product
from orders.models import Order
from users.models import User
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponseForbidden


# Create your views here.
def dashboard(request):
    return render(request, 'demo/dashboard.html')


def pending_orders(request):
    # Optional: Restrict to admin users only
    if request.user.role != 'demo':
        return HttpResponseForbidden("Demo only")

    pending_orders = Order.objects.filter(status='pending').select_related(
        'restaurant__restaurant',  # so you can use order.restaurant.restaurant
        'customer__address'        # safe lookup for customer address
    )


    order_data = []
    for order in pending_orders:
        items = order.items.select_related('product').all()
        order_data.append({
            'id': order.id,
            'token_number': order.token_number,
            'created_at': order.created_at.isoformat(),
            'customer_name': order.customer.get_full_name() if order.customer else 'Unknown',
            'customer_address': {
                'barangay': getattr(getattr(order.customer, 'address', None), 'barangay', '')
            },
            'restaurant_profile': order.restaurant.restaurant.profile_picture.url
                if hasattr(order.restaurant, 'restaurant') and order.restaurant.restaurant.profile_picture else '/static/default.png',
            'total_amount': str(order.total_amount),
            'items': [{
                'product': {
                    'name': item.product.name
                },      
                'quantity': item.quantity
            } for item in items]
        })

    return JsonResponse({'orders': order_data})
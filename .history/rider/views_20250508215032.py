from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from rider.models import Rider
from .models import Rider, RiderEarnings
from django.shortcuts import render
from orders.models import Order
from customer.models import Address
from restaurant.models import Restaurant
from django.contrib.auth.models import User
from django.db.models import Sum
import json


@require_POST
@login_required
def toggle_status(request):
    rider = Rider.objects.get(user=request.user)
    rider.is_available = not rider.is_available
    rider.save()
    return JsonResponse({
        'new_status': 'Online' if rider.is_available else 'Offline',
        'status_image': f"{'online' if rider.is_available else 'offline'}.png"
    })

@login_required
def rider_dashboard(request):
    rider = Rider.objects.get(user=request.user)

    total_earnings = RiderEarnings.get_total_earnings(rider)
    daily_earnings = RiderEarnings.get_daily_earnings(rider)
    weekly_earnings = RiderEarnings.get_weekly_earnings(rider)
    monthly_earnings = RiderEarnings.get_monthly_earnings(rider)

    context = {
        'rider': rider,
        'total_earnings': total_earnings,
        'daily_earnings': daily_earnings,
        'weekly_earnings': weekly_earnings,
        'monthly_earnings': monthly_earnings,
    }

    return render(request, 'rider/dashboard.html', context)

def complete_delivery(rider, amount):
    RiderEarnings.objects.create(rider=rider, amount=amount)
    
def get_available_orders(request):
    count = Order.objects.filter(status__in=['pending', 'accepted', 'preparing', 'ready']).count()
    return JsonResponse({'count': count})


@csrf_exempt
def fetch_orders(request):
    if request.method == 'POST':
        orders = Order.objects.filter(status__in=['pending', 'accepted', 'preparing', 'ready'])

        order_list = []
        for order in orders:
            try:
                # Get related models
                restaurant_obj = Restaurant.objects.get(user=order.restaurant)
                customer_address = Address.objects.get(user=order.customer)

                # Calculate subtotal from OrderLine
                subtotal = order.items.aggregate(total=Sum('subtotal'))['total'] or 0

                order_data = {
                    'order_id': order.id,
                    'restaurant_barangay': restaurant_obj.user.restaurant.barangay if hasattr(restaurant_obj.user, 'restaurant') else '',
                    'customer_barangay': customer_address.barangay,
                    'customer_street': customer_address.street,
                    'restaurant': {
                        'name': restaurant_obj.user.first_name,
                    },
                    'total_amount': float(order.total_amount),
                    'rider_fee': float(order.rider_fee),
                    'small_order_fee': float(order.small_order_fee),
                    'subtotal': float(subtotal),
                }
                order_list.append(order_data)

            except Exception as e:
                print(f"Error processing order {order.id}: {e}")
                continue

        return JsonResponse({'success': True, 'orders': order_list})
    return JsonResponse({'success': False, 'message': 'Invalid request'})
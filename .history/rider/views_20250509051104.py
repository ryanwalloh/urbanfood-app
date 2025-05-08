from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from rider.models import Rider
from .models import Rider, RiderEarnings
from django.shortcuts import render
from orders.models import Order, OrderLine
from customer.models import Address, Customer
from restaurant.models import Restaurant
from django.contrib.auth.models import User
from django.db.models import Sum
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
import logging

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
    # Count orders that don't have a rider assigned (rider is None or NULL)
    count = Order.objects.filter(rider__isnull=True, status__in=['pending', 'accepted', 'preparing', 'ready']).count()
    return JsonResponse({'count': count})


@csrf_exempt
def fetch_orders(request):
    if request.method == 'POST':
        orders = Order.objects.filter(rider__isnull=True)

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
                    'restaurant_barangay': restaurant_obj.barangay,
                    'customer_barangay': customer_address.barangay,
                    'customer_street': customer_address.street,
                    'restaurant': {
                        'name': restaurant_obj.name,
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

def orders_view(request):
    return render(request, 'rider/orders.html')


def dashboard_view(request):
    return render(request, 'rider/dashboard.html')


@csrf_exempt  # Optional: Only if CSRF token is not sent in JS
def update_order_status(request):
    if request.method == 'POST':
        if not request.user.is_authenticated or request.user.role != 'rider':
            return JsonResponse({'success': False, 'message': 'Unauthorized: Only riders can update orders.'})

        order_id = request.POST.get('order_id')

        try:
            order = Order.objects.get(id=order_id)

            # First time acceptance
            if order.rider is None:
                order.rider = request.user
                order.save()
                return JsonResponse({'success': True, 'message': 'Order accepted and rider assigned.'})

            else:
                return JsonResponse({'success': False, 'message': 'Order is already assigned to a rider.'})

        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Order not found.'})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})


def deliver(request):
    # You can pass the order_id or any other necessary data to the template
    order_id = request.GET.get('order_id')
    return render(request, 'rider/deliver.html', {'order_id': order_id})



logger = logging.getLogger(__name__)


@csrf_exempt
def fetch_order_details(request):
    if request.method == 'POST':
        try:
            import json
            data = json.loads(request.body)
            order_id = data.get('order_id')
            
            if not order_id:
                logger.error('Order ID is missing from request body.')
                return JsonResponse({'error': 'Missing order_id.'}, status=400)

            order = Order.objects.get(id=order_id)

            # Make sure the current user is the assigned rider
            if request.user != order.rider:
                logger.error(f'Unauthorized access attempt by {request.user.username}.')
                return JsonResponse({'error': 'Unauthorized access.'}, status=403)

            restaurant_obj = Restaurant.objects.get(user=order.restaurant)
            customer_obj = Customer.objects.get(user=order.customer)
            customer_address = Address.objects.get(user=order.customer)

            subtotal = order.items.aggregate(total=Sum('subtotal'))['total'] or 0

            response_data = {
                'order_id': order.id,
                'restaurant_profile': request.build_absolute_uri(restaurant_obj.profile_picture.url) if restaurant_obj.profile_picture else '',
                'restaurant_name': restaurant_obj.name,
                'restaurant_barangay': restaurant_obj.barangay,
                'restaurant_street': restaurant_obj.street,
                'customer_first_name': customer_obj.user.first_name,
                'customer_last_name': customer_obj.user.last_name,
                'customer_phone': customer_obj.phone,
                'customer_barangay': customer_address.barangay,
                'customer_street': customer_address.street,
                'total_amount': float(order.total_amount),
                'rider_fee': float(order.rider_fee),
                'small_order_fee': float(order.small_order_fee),
                'subtotal': float(subtotal),
            }

            return JsonResponse(response_data)

        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found.'}, status=404)
        except Exception as e:
            import traceback
            print("DEBUG: Exception in fetch_order_details:\n", traceback.format_exc())
            return JsonResponse({'error': str(e)}, status=500)


    return JsonResponse({'error': 'Invalid request method.'}, status=400)

@csrf_exempt
def add_rider_earnings(request):
    if request.method == 'POST':
        rider_id = request.POST.get('rider_id')
        amount = request.POST.get('amount')  # Rider fee
        total_amount = request.POST.get('total_amount')  # Total order amount
        order_id = request.POST.get('order_id')  # Order ID to fetch the order details

        try:
            rider = Rider.objects.get(id=rider_id)

            # Fetch the order to get the rider fee and total amount
            order = Order.objects.get(id=order_id)

            # Check if the rider fee and total amount match the order details
            if float(amount) != float(order.rider_fee):
                return JsonResponse({'status': 'error', 'message': 'Rider fee mismatch.'}, status=400)
            
            if float(total_amount) != float(order.total_amount):
                return JsonResponse({'status': 'error', 'message': 'Total amount mismatch.'}, status=400)

            # Add the rider's earnings to the RiderEarnings table
            rider_fee = float(amount)  # The rider fee that will be added to earnings
            earned_at = timezone.now()  # When the earnings are added

            # Add earnings to the RiderEarnings table
            earnings = RiderEarnings(rider=rider, amount=rider_fee, earned_at=earned_at)
            earnings.save()

            return JsonResponse({'status': 'success', 'message': 'Earnings added successfully.'}, status=200)

        except Rider.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Rider not found.'}, status=400)
        except Order.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Order not found.'}, status=404)

    return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=400)

@csrf_exempt
@login_required
def fetch_updated_earnings(request):
    if request.method == 'POST':
        rider = Rider.objects.get(user=request.user)
        total_earnings = RiderEarnings.get_total_earnings(rider)
        return JsonResponse({'total_earnings': total_earnings})
    return JsonResponse({'error': 'Invalid request method.'}, status=400)

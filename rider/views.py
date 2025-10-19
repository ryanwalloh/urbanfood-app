from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from rider.models import Rider
from .models import Rider, RiderEarnings
from django.shortcuts import render
from orders.models import Order, OrderLine
from customer.models import Address, Customer
from restaurant.models import Restaurant
from users.models import User
from django.db.models import Sum
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
import logging
import os
import boto3
from botocore.config import Config
from django.conf import settings
import requests

@csrf_exempt
@login_required
def get_status(request):
    if request.method == 'GET':
        rider = Rider.objects.get(user=request.user)
        return JsonResponse({
            'success': True,
            'is_available': rider.is_available,
            'status': 'Online' if rider.is_available else 'Offline'
        })
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
@require_POST
@login_required
def toggle_status(request):
    rider = Rider.objects.get(user=request.user)
    
    # Check if a specific status is provided in the request
    target_status = request.POST.get('status')
    
    if target_status is not None:
        # Set to specific status (UI is source of truth)
        rider.is_available = target_status.lower() in ['true', '1', 'online', 'yes']
    else:
        # Fallback to toggle behavior for backward compatibility
        rider.is_available = not rider.is_available
    
    rider.save()
    return JsonResponse({
        'success': True,
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


@csrf_exempt
def update_order_status(request):
    if request.method == 'POST':
        if not request.user.is_authenticated or request.user.role != 'rider':
            return JsonResponse({'success': False, 'message': 'Unauthorized: Only riders can update orders.'})

        order_id = request.POST.get('order_id')
        new_status = request.POST.get('status')  # get status like 'otw' or 'delivered'

        try:
            order = Order.objects.get(id=order_id)

            # If it's a new rider assignment
            if order.rider is None:
                order.rider = request.user
                order.status = 'assigned'  # Set status to 'assigned' when rider accepts

                order.save()
                return JsonResponse({'success': True, 'message': f'Order accepted and status updated to assigned.'})

            # Rider tries to update status
            elif order.rider == request.user:
                if new_status in ['assigned', 'otw', 'arrived', 'delivered']:
                    order.status = new_status
                    order.save()
                    return JsonResponse({'success': True, 'message': f'Order status updated to {new_status}.'})
                else:
                    return JsonResponse({'success': False, 'message': 'Invalid status update.'})

            else:
                return JsonResponse({'success': False, 'message': 'You are not assigned to this order.'})

        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Order not found.'})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})


@csrf_exempt
def recent_transactions(request):
    if request.method != 'GET':
        return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)

    try:
        # Handle authentication for both web and mobile
        user = None
        
        # Check if user is authenticated via session (web)
        if request.user.is_authenticated:
            user = request.user
        else:
            # For mobile apps, check if user_id is provided in query params
            user_id = request.GET.get('user_id')
            if user_id:
                try:
                    user = User.objects.get(id=user_id, role='rider')
                except User.DoesNotExist:
                    return JsonResponse({'success': False, 'message': 'Invalid user ID'}, status=400)
            else:
                return JsonResponse({'success': False, 'message': 'Authentication required'}, status=401)

        # Fetch latest delivered orders for this rider
        orders = (
            Order.objects
            .filter(rider=user, status='delivered')
            .order_by('-created_at')[:10]
        )

        results = []
        for order in orders:
            try:
                restaurant_obj = Restaurant.objects.get(user=order.restaurant)
            except Restaurant.DoesNotExist:
                restaurant_obj = None

            try:
                customer_obj = Customer.objects.get(user=order.customer)
            except Customer.DoesNotExist:
                customer_obj = None

            try:
                customer_address = Address.objects.get(user=order.customer)
            except Address.DoesNotExist:
                customer_address = None

            customer_full_name = ''
            if customer_obj and customer_obj.user:
                first_name = getattr(customer_obj.user, 'first_name', '') or ''
                last_name = getattr(customer_obj.user, 'last_name', '') or ''
                customer_full_name = (first_name + ' ' + last_name).strip() or getattr(customer_obj.user, 'username', '')

            address_text = ''
            barangay = ''
            if customer_address:
                street = getattr(customer_address, 'street', '') or ''
                barangay = getattr(customer_address, 'barangay', '') or ''
                address_text = (street + (', ' if street and barangay else '') + barangay) or barangay or street

            # Optionally derive plus_code via Google Geocoding (if key provided)
            plus_code = ''
            try:
                api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
                if api_key and customer_address:
                    query = (address_text or barangay) or ''
                    if query:
                        geo_resp = requests.get(
                            'https://maps.googleapis.com/maps/api/geocode/json',
                            params={'address': query, 'key': api_key},
                            timeout=4
                        )
                        if geo_resp.ok:
                            geo = geo_resp.json()
                            if geo.get('status') == 'OK' and geo.get('results'):
                                plus_code = geo['results'][0].get('plus_code', {}).get('global_code', '') or ''
            except Exception:
                plus_code = ''

            results.append({
                'id': order.id,
                'restaurant': restaurant_obj.name if restaurant_obj else 'Restaurant',
                'customer': customer_full_name or 'Customer',
                'address': address_text,
                'barangay': barangay,
                'plus_code': plus_code,
                'amount': float(getattr(order, 'total_amount', 0) or 0),
                'rider_fee': float(getattr(order, 'rider_fee', 0) or 0),
                'time': order.created_at.strftime('%A, %I:%M%p'),
            })

        return JsonResponse({'success': True, 'transactions': results})
    except Exception as e:
        logger.error(f"recent_transactions error: {e}")
        return JsonResponse({'success': False, 'message': 'Failed to load transactions'}, status=500)


@csrf_exempt
def update_order_with_proof(request):
    if request.method == 'POST':
        if not request.user.is_authenticated or request.user.role != 'rider':
            return JsonResponse({'success': False, 'message': 'Unauthorized: Only riders can update orders.'})

        order_id = request.POST.get('order_id')
        proof_of_delivery_url = request.POST.get('proof_of_delivery_url')
        new_status = request.POST.get('status', 'delivered')

        try:
            order = Order.objects.get(id=order_id)

            # Check if rider is assigned to this order
            if order.rider == request.user:
                # Update order with proof of delivery URL and status
                order.proof_of_delivery_url = proof_of_delivery_url
                order.status = new_status
                order.save()
                
                return JsonResponse({
                    'success': True, 
                    'message': f'Order completed with proof of delivery. Status updated to {new_status}.'
                })
            else:
                return JsonResponse({'success': False, 'message': 'You are not assigned to this order.'})

        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Order not found.'})

    return JsonResponse({'success': False, 'message': 'Invalid request method.'})


# (Removed) Presigned S3 URL endpoint — replaced by Cloudinary client-side upload


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

            # Get restaurant profile picture URL (Cloudinary URLs are already absolute)
            restaurant_profile_url = ''
            if restaurant_obj.profile_picture:
                pic_url = str(restaurant_obj.profile_picture)
                if pic_url.startswith('http'):
                    restaurant_profile_url = pic_url
                else:
                    restaurant_profile_url = request.build_absolute_uri(restaurant_obj.profile_picture.url)
            
            response_data = {
                'order_id': order.id,
                'status': order.status,  # Add order status to response
                'restaurant_profile': restaurant_profile_url,
                'restaurant_name': restaurant_obj.name,
                'restaurant_barangay': restaurant_obj.barangay,
                'restaurant_street': restaurant_obj.street,
                'customer_first_name': customer_obj.user.first_name,
                'customer_last_name': customer_obj.user.last_name,
                'customer_phone': customer_obj.phone,
                'customer_barangay': customer_address.barangay,
                'customer_street': customer_address.street,
                'customer_latitude': float(customer_address.latitude) if customer_address.latitude else None,
                'customer_longitude': float(customer_address.longitude) if customer_address.longitude else None,
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

@login_required
def profile_page(request):
    """Profile page view"""
    try:
        rider = Rider.objects.get(user=request.user)
        return render(request, 'rider/profile.html', {
            'rider': rider,
            'user': request.user
        })
    except Rider.DoesNotExist:
        return render(request, 'rider/profile.html', {
            'rider': None,
            'user': request.user
        })

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
import os
import boto3
from botocore.config import Config

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
                order.status = new_status  # Set status to 'otw' when rider accepts

                order.save()
                return JsonResponse({'success': True, 'message': f'Order accepted and status updated to {new_status}.'})

            # Rider tries to update status
            elif order.rider == request.user:
                if new_status in ['otw', 'arrived', 'delivered']:
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


@csrf_exempt
def get_presigned_upload_url(request):
    if request.method == 'POST':
        if not request.user.is_authenticated or request.user.role != 'rider':
            return JsonResponse({'success': False, 'message': 'Unauthorized: Only riders can request upload URLs.'}, status=403)

        # Accept both JSON and form-urlencoded
        try:
            if request.content_type and 'application/json' in request.content_type:
                data = json.loads(request.body or '{}')
                order_id = data.get('order_id')
                file_name = data.get('file_name')
                file_type = data.get('file_type', 'image/jpeg')
            else:
                order_id = request.POST.get('order_id')
                file_name = request.POST.get('file_name')
                file_type = request.POST.get('file_type', 'image/jpeg')
        except Exception:
            return JsonResponse({'success': False, 'message': 'Invalid payload'}, status=400)

        if not order_id or not file_name:
            return JsonResponse({'success': False, 'message': 'Missing order_id or file_name'}, status=400)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Order not found.'}, status=404)

        # Verify rider
        if order.rider != request.user:
            return JsonResponse({'success': False, 'message': 'You are not assigned to this order.'}, status=403)

        # AWS Config from env (no insecure fallbacks)
        aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
        aws_bucket = os.environ.get('AWS_STORAGE_BUCKET_NAME')
        aws_region = os.environ.get('AWS_S3_REGION_NAME', 'ap-southeast-2')

        # Validate required AWS configuration early
        if not aws_access_key or not aws_secret_key or not aws_bucket:
            return JsonResponse(
                {
                    'success': False,
                    'message': 'Server misconfiguration: Missing AWS credentials or bucket.'
                },
                status=500
            )

        # Build key
        key = f"proof-of-delivery/{order_id}/{file_name}"

        try:
            # Force SigV4 and regional endpoint to avoid SigV2/region issues
            boto_config = Config(
                signature_version='s3v4',
                s3={'addressing_style': 'virtual'}
            )
            s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key,
                aws_secret_access_key=aws_secret_key,
                region_name=aws_region,
                endpoint_url=f"https://s3.{aws_region}.amazonaws.com",
                config=boto_config,
            )

            # Validate credentials via STS (early fail if invalid)
            try:
                sts = boto3.client(
                    'sts',
                    aws_access_key_id=aws_access_key,
                    aws_secret_access_key=aws_secret_key,
                    region_name=aws_region,
                )
                sts.get_caller_identity()
            except Exception as cred_err:
                return JsonResponse({'success': False, 'message': f'AWS credentials invalid: {str(cred_err)}'}, status=500)

            # Include ACL header for public-read so client must send it too
            params = {
                'Bucket': aws_bucket,
                'Key': key,
                'ContentType': file_type,
                'ACL': 'public-read',
            }

            presigned_url = s3_client.generate_presigned_url(
                'put_object',
                Params=params,
                ExpiresIn=300,
                HttpMethod='PUT',
            )

            file_url = f"https://{aws_bucket}.s3.{aws_region}.amazonaws.com/{key}"

            # Debug (non-sensitive) logging
            try:
                logging.getLogger(__name__).info(
                    f"Presigned S3 PUT for key='{key}', bucket='{aws_bucket}', region='{aws_region}'")
            except Exception:
                pass

            return JsonResponse({
                'success': True,
                'url': presigned_url,
                'file_url': file_url,
                'key': key,
                'expires_in': 300,
                'content_type': file_type,
                'acl': 'public-read',
            })
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'AWS presign error: {str(e)}'}, status=500)

    return JsonResponse({'success': False, 'message': 'Invalid request method.'}, status=405)


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
                'status': order.status,  # Add order status to response
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

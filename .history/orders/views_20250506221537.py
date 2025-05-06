from django.shortcuts import render
from rest_framework import viewsets
from .models import Order, OrderLine
from .serializers import OrderSerializer, OrderLineSerializer
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderLineViewSet(viewsets.ModelViewSet):
    queryset = OrderLine.objects.all()
    serializer_class = OrderLineSerializer

@require_POST
@login_required
def prepare_order(request):
    order_id = request.POST.get('order_id')

    try:
        order = Order.objects.get(id=order_id, restaurant=request.user)
        if order.status == 'pending':
            order.status = 'preparing'
            order.save()
            return JsonResponse({'success': True, 'new_status': 'preparing'})
        return JsonResponse({'success': False, 'message': 'Invalid status'})
    except Order.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found'})
    

@require_POST
@login_required
def mark_order_arrived(request):
    order_id = request.POST.get('order_id')

    try:
        order = Order.objects.get(id=order_id, restaurant=request.user)
        if order.status == 'ready':
            order.status = 'delivered'
            order.save()
            return JsonResponse({'success': True, 'new_status': 'delivered'})
        return JsonResponse({'success': False, 'message': 'Invalid status transition'})
    except Order.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found'})
    
@require_POST
@login_required
def mark_order_ready(request):
    order_id = request.POST.get('order_id')

    try:
        order = Order.objects.get(id=order_id, restaurant=request.user)
        if order.status == 'preparing':
            order.status = 'ready'
            order.save()
            return JsonResponse({'success': True, 'new_status': 'ready'})
        return JsonResponse({'success': False, 'message': 'Invalid status transition'})
    except Order.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Order not found'})



@login_required
def get_pending_orders(request):
    try:
        orders = Order.objects.filter(status='pending', restaurant=request.user).order_by('-created_at')

        data = []
        for order in orders:
            customer = getattr(order, 'customer', None)
            if not customer:
                continue  # Skip orders without valid customer

            user = getattr(customer, 'user', None)
            full_name = user.get_full_name() if user else 'Unknown'

            address = customer.address if customer.address else 'No address provided'

            data.append({
                'id': order.id,
                'token_number': order.token_number,
                'customer_name': full_name,
                'address': address,
                'total_amount': order.total_amount,
                'created_at': order.created_at.strftime('%I:%M %p'),
            })

        return JsonResponse({'orders': data})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
from django.shortcuts import render
from rest_framework import viewsets
from .models import Order, OrderLine
from .serializers.serializers import OrderSerializer, OrderLineSerializer
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
import json
import time


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


@require_GET
@login_required
def get_pending_orders_count(request):
    """
    Get count of orders that are available for riders to pick up:
    - pending, accepted, preparing, ready
    - NOT assigned, otw, cancelled, delivered
    """
    try:
        # Count orders that are available for riders
        pending_count = Order.objects.filter(
            Q(status='pending') | 
            Q(status='accepted') | 
            Q(status='preparing') | 
            Q(status='ready')
        ).count()
        
        return JsonResponse({
            'success': True,
            'count': pending_count,
            'message': f'{pending_count} orders available for pickup'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'count': 0
        })




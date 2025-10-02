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


@csrf_exempt
@login_required
def orders_sse_stream(request):
    """
    Server-Sent Events endpoint for real-time order count updates
    """
    from .signals import add_rider_connection, remove_rider_connection
    
    def event_stream():
        rider_id = request.user.id
        
        # Add rider to connected list
        add_rider_connection(rider_id)
        
        try:
            # Send initial count
            initial_count = Order.objects.filter(
                Q(status='pending') | 
                Q(status='accepted') | 
                Q(status='preparing') | 
                Q(status='ready')
            ).count()
            
            yield f"data: {json.dumps({'type': 'order_count', 'count': initial_count})}\n\n"
            
            # Keep connection alive and send periodic updates
            while True:
                # Send heartbeat every 30 seconds
                yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': time.time()})}\n\n"
                time.sleep(30)
                
        except GeneratorExit:
            # Rider disconnected
            remove_rider_connection(rider_id)
        except Exception as e:
            print(f"❌ SSE Error for rider {rider_id}: {e}")
            remove_rider_connection(rider_id)
    
    response = StreamingHttpResponse(
        event_stream(),
        content_type='text/event-stream'
    )
    response['Cache-Control'] = 'no-cache'
    response['Connection'] = 'keep-alive'
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Headers'] = 'Cache-Control'
    
    return response




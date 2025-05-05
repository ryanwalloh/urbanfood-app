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

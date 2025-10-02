from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Order
import json
import threading
import time

# In-memory storage for connected riders (in production, use Redis or similar)
connected_riders = set()

def add_rider_connection(rider_id):
    """Add a rider to the connected riders set"""
    connected_riders.add(rider_id)
    print(f"📱 Rider {rider_id} connected for real-time updates")

def remove_rider_connection(rider_id):
    """Remove a rider from the connected riders set"""
    connected_riders.discard(rider_id)
    print(f"📱 Rider {rider_id} disconnected")

def get_connected_riders():
    """Get list of connected riders"""
    return list(connected_riders)

def notify_riders_of_order_change():
    """Notify all connected riders of order count change via WebSocket"""
    from .models import Order
    from django.db.models import Q
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    # Get current pending orders count
    pending_count = Order.objects.filter(
        Q(status='pending') | 
        Q(status='accepted') | 
        Q(status='preparing') | 
        Q(status='ready')
    ).count()
    
    # Log the notification
    print(f"📦 Notifying all riders via WebSocket: {pending_count} orders available")
    
    # Send WebSocket message to all connected riders
    channel_layer = get_channel_layer()
    if channel_layer:
        # Send to all rider groups (in a real app, you'd track connected riders)
        # For now, we'll send to a general orders group
        async_to_sync(channel_layer.group_send)(
            'orders_updates',
            {
                'type': 'order_count_update',
                'count': pending_count,
                'message': f'{pending_count} orders available for pickup'
            }
        )

@receiver(post_save, sender=Order)
def order_created_or_updated(sender, instance, created, **kwargs):
    """Triggered when an order is created or updated"""
    if created:
        print(f"🆕 New order created: {instance.token_number} - Status: {instance.status}")
    else:
        print(f"🔄 Order updated: {instance.token_number} - Status: {instance.status}")
    
    # Notify riders of the change
    notify_riders_of_order_change()

@receiver(post_delete, sender=Order)
def order_deleted(sender, instance, **kwargs):
    """Triggered when an order is deleted"""
    print(f"🗑️ Order deleted: {instance.token_number}")
    
    # Notify riders of the change
    notify_riders_of_order_change()

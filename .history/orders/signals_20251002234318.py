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
    """Notify all connected riders of order count change"""
    from .models import Order
    from django.db.models import Q
    
    # Get current pending orders count
    pending_count = Order.objects.filter(
        Q(status='pending') | 
        Q(status='accepted') | 
        Q(status='preparing') | 
        Q(status='ready')
    ).count()
    
    # Create notification message
    notification = {
        'type': 'order_count_update',
        'count': pending_count,
        'timestamp': time.time()
    }
    
    # In a real implementation, you would send this via WebSocket/SSE
    # For now, we'll just log it
    print(f"📦 Notifying {len(connected_riders)} riders: {pending_count} orders available")
    
    # TODO: Implement actual push notification here
    # This could be done with:
    # - Django Channels for WebSocket
    # - Server-Sent Events (SSE)
    # - Firebase Cloud Messaging (FCM)
    # - Pusher, etc.

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

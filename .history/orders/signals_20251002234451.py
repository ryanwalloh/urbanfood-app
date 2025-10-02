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
    
    # Log the notification
    print(f"📦 Notifying {len(connected_riders)} riders: {pending_count} orders available")
    
    # Store the latest notification for SSE connections to pick up
    # In a production environment, you would use a proper message queue like Redis
    global latest_notification
    latest_notification = notification

# Global variable to store latest notification (in production, use Redis)
latest_notification = None

def get_latest_notification():
    """Get the latest order count notification"""
    return latest_notification

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

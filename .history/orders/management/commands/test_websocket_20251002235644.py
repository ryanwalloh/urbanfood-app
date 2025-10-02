from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from orders.models import Order
from django.db.models import Q


class Command(BaseCommand):
    help = 'Test WebSocket connection and send a test order update'

    def handle(self, *args, **options):
        # Get pending orders count
        pending_count = Order.objects.filter(
            Q(status='pending') | 
            Q(status='accepted') | 
            Q(status='preparing') | 
            Q(status='ready')
        ).count()
        
        self.stdout.write(f'📦 Current pending orders: {pending_count}')
        
        # Send test message via WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                'orders_updates',
                {
                    'type': 'order_count_update',
                    'count': pending_count,
                    'message': f'Test: {pending_count} orders available for pickup'
                }
            )
            self.stdout.write('✅ Test WebSocket message sent')
        else:
            self.stdout.write('❌ Channel layer not configured')

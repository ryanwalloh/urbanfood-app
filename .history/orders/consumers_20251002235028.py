import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Order
from django.db.models import Q


class OrderUpdatesConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get the user from the session (you might need to adjust this based on your auth)
        self.user = self.scope["user"]
        
        if self.user.is_authenticated:
            # Create a unique group name for this rider
            self.group_name = f"rider_{self.user.id}_orders"
            
            # Join the group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            await self.accept()
            
            # Send initial order count
            await self.send_initial_count()
            
            print(f"📡 WebSocket connected for rider {self.user.id}")
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            # Leave the group
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
            print(f"📡 WebSocket disconnected for rider {self.user.id}")

    async def send_initial_count(self):
        """Send the initial order count when rider connects"""
        count = await self.get_pending_orders_count()
        await self.send(text_data=json.dumps({
            'type': 'order_count_update',
            'count': count,
            'message': f'{count} orders available for pickup'
        }))

    async def order_count_update(self, event):
        """Send order count update to the rider"""
        await self.send(text_data=json.dumps({
            'type': 'order_count_update',
            'count': event['count'],
            'message': event.get('message', f"{event['count']} orders available for pickup")
        }))

    @database_sync_to_async
    def get_pending_orders_count(self):
        """Get count of pending orders from database"""
        return Order.objects.filter(
            Q(status='pending') | 
            Q(status='accepted') | 
            Q(status='preparing') | 
            Q(status='ready')
        ).count()

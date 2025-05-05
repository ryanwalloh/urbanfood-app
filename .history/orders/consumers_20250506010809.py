from channels.generic.websocket import AsyncWebsocketConsumer
import json

class OrderConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.restaurant_id = self.scope['user'].id
        self.room_group_name = f"orders_{self.restaurant_id}"

        # Join the restaurant-specific group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Handle incoming messages if needed
        pass

    async def order_update(self, event):
        # Called when order data is sent to the WebSocket
        order = event['order']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'order': order
        }))

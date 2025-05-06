# restaurant/serializers.py
from rest_framework import serializers
from orders.models import Order
from customer.models import Address
from customer.serializers import AddressSerializer
from menu.models import Product
from menu.serializers import ProductSerializer  # Assuming you already have a Product serializer

class OrderSerializer(serializers.ModelSerializer):
    customer_address = AddressSerializer(source='customer.address')  # Serialize the Address
    items = ProductSerializer(many=True)  # Assuming `items` is a related field in `Order`

    class Meta:
        model = Order
        fields = ['id', 'token_number', 'customer_name', 'customer_address', 'created_at', 'total_amount', 'rider_name', 'rider_phone', 'items']

    def get_customer_name(self, obj):
        return obj.customer.get_full_name()

    def get_rider_name(self, obj):
        return obj.rider.get_full_name() if obj.rider else 'Not Assigned'

    def get_rider_phone(self, obj):
        return obj.rider.phone if obj.rider else 'N/A'

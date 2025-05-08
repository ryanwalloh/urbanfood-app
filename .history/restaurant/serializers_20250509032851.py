# restaurant/serializers.py
from rest_framework import serializers
from orders.models import Order
from customer.models import Address
from customer.serializers import AddressSerializer
from menu.models import Product
from menu.serializers import ProductSerializer
from orders.models import OrderLine
from orders.serializers.serializers import OrderLineSerializer  # Assuming you have an OrderLine serializer

class OrderSerializer(serializers.ModelSerializer):
    customer_address = AddressSerializer(source='customer.address')  # Serialize the Address
    items = OrderLineSerializer(many=True)  # Use OrderLineSerializer for items

    customer_name = serializers.SerializerMethodField()  # Customer's name field
    rider_name = serializers.SerializerMethodField()  # Rider's name field
    rider_phone = serializers.SerializerMethodField()  # Rider's phone field

    class Meta:
        model = Order
        fields = ['id', 'token_number', 'customer_name', 'customer_address', 'created_at', 'total_amount', 'rider_name', 'rider_phone', 'items']

    def get_customer_name(self, obj):
        return obj.customer.get_full_name()

    def get_rider_name(self, obj):
        if obj.rider:
            return obj.rider.get_full_name()  # Access full_name of the rider (User model)
        return 'Not Assigned'

    def get_rider_phone(self, obj):
        if obj.rider:
            return obj.rider.phone  # Access phone number of the rider (User model)
        return 'N/A'

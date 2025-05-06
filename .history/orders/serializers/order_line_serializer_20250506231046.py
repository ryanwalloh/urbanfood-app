# orders/serializers/order_line_serializer.py
from rest_framework import serializers
from orders.models import OrderLine
from menu.models import Product
from menu.serializers import ProductSerializer

class OrderLineSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = OrderLine
        fields = ['id', 'order', 'product', 'quantity']
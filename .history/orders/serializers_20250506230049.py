# orders/serializers.py
from rest_framework import serializers
from orders.models import OrderLine
from menu.serializers import ProductSerializer

class OrderLineSerializer(serializers.ModelSerializer):
    product = ProductSerializer()  # Serialize product details

    class Meta:
        model = OrderLine
        fields = ['product', 'quantity', 'subtotal']

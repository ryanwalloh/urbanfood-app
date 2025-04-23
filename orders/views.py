from django.shortcuts import render
from rest_framework import viewsets
from .models import Order, OrderLine
from .serializers import OrderSerializer, OrderLineSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class OrderLineViewSet(viewsets.ModelViewSet):
    queryset = OrderLine.objects.all()
    serializer_class = OrderLineSerializer


from django.shortcuts import render
from rest_framework import viewsets
from .models import RiderLocation
from .serializers import RiderLocationSerializer

class RiderLocationViewSet(viewsets.ModelViewSet):
    queryset = RiderLocation.objects.all()
    serializer_class = RiderLocationSerializer

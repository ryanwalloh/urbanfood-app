from django.shortcuts import render
from rest_framework import viewsets
from restaurant.models import Restaurant
from .models import User
from .serializers import UserSerializer
from users.decorators import role_required

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


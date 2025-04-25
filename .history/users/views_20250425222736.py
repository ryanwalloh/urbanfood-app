from django.shortcuts import render
from rest_framework import viewsets
from restaurant.models import Restaurant
from .models import User
from .serializers import UserSerializer
from users.decorators import role_required

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# Only allow customers to access this page
@role_required(allowed_roles=['customer'])
def customer_home(request):
    restaurants = Restaurant.objects.filter(is_approved=True)
    return render(request, 'customer/main_page.html', {'restaurants': restaurants})

# Only allow restaurants to access this page
@role_required(allowed_roles=['restaurant'])
def restaurant_home(request):
    return render(request, 'restaurant/restaurant.html')

# Only allow riders to access this page
@role_required(allowed_roles=['rider'])
def rider_home(request):
    return render(request, 'rider/rider.html')
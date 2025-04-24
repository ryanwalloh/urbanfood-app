
# customer/views.py
from django.shortcuts import render
from restaurant.models import Restaurant  # Correct import

def vendor_list(request):
    restaurants = Restaurant.objects.all()
    return render(request, 'customer/vendor_list.html', {'restaurants': restaurants})
from django.shortcuts import render, get_object_or_404
from .models import Restaurant

def restaurant_detail(request, restaurant_id):
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    return render(request, 'restaurant/detail.html', {'restaurant': restaurant})

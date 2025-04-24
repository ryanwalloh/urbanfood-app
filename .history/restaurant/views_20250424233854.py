from django.shortcuts import render, get_object_or_404
from .models import Restaurant

def restaurant_detail(request, restaurant_id):
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    products = Product.objects.filter(restaurant=restaurant)  # example
    return render(request, 'restaurant/storefront.html', {
        'restaurant': restaurant,
        'products': products,
    })
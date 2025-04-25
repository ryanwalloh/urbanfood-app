# restaurant/views.py

from django.shortcuts import render, get_object_or_404
from menu.models import Product  # Import Product from the menu app
from .models import Restaurant  # Import Restaurant from the restaurant app

def restaurant_detail(request, restaurant_id):
    # Fetch the restaurant based on the provided restaurant_id, if it doesn't exist return a 404 error
    restaurant = get_object_or_404(Restaurant, id=restaurant_id)
    
    # Fetch products that belong to the given restaurant
    products = Product.objects.filter(restaurant=restaurant)
    
    # Render the restaurant detail page with the fetched restaurant and products
    return render(request, 'restaurant/storefront.html', {
        'restaurant': restaurant,
        'products': products,
    })
    
    def vendor_list(request):
    restaurants = Restaurant.objects.all()
    return render(request, 'customer/vendor_list.html', {'restaurants': restaurants})
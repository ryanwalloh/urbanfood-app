from django.shortcuts import render, redirect
from restaurant.models import Restaurant
from rider.models import Rider
from customer.models import Customer
from menu.models import Product
from orders.models import Order
from users.models import User

def dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('core:login')

    context = {
        'restaurants': Restaurant.objects.all(),
        'riders': Rider.objects.all(),
        'customers': Customer.objects.all(),
        'products': Product.objects.all(),
        'orders': Order.objects.all(),
        'users': User.objects.all(),
    }
   return render(request, 'admin_panel/dashboard.html', {...})

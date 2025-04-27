# customer/views.py

from restaurant.models import Restaurant 
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import AddressForm, PersonalDetailsForm
from .models import Address
from django.contrib import messages
from django.http import JsonResponse

def vendor_list(request):
    restaurants = Restaurant.objects.all()
    return render(request, 'customer/vendor_list.html', {'restaurants': restaurants})

# View to handle the checkout page
@login_required
def checkout(request):
    # Get the customer's current address, or create a new one
    address = Address.objects.filter(user=request.user).first()
    address_form = AddressForm(instance=address)
    personal_form = PersonalDetailsForm(instance=request.user)

    # Capture subtotal, total, and quantity from the POST request
    subtotal = request.POST.get('subtotal')
    total = request.POST.get('total')
    quantity = request.POST.get('quantity')

    if request.method == 'POST':
        if 'address-submit' in request.POST:
            # Process Address form
            address_form = AddressForm(request.POST, instance=address)
            if address_form.is_valid():
                address_form.save()
                messages.success(request, 'Address updated successfully!')
                return redirect('checkout')
        elif 'personal-details-submit' in request.POST:
            # Process Personal Details form
            personal_form = PersonalDetailsForm(request.POST, instance=request.user)
            if personal_form.is_valid():
                personal_form.save()
                messages.success(request, 'Personal details updated successfully!')
                return redirect('checkout')
        elif 'payment-submit' in request.POST:
            # Capture the selected payment method from the POST data
            payment_method = request.POST.get('payment_method')
            if payment_method:
                # Here you can store the payment method to the order or trigger any payment-related process
                messages.success(request, f'Payment method {payment_method} selected!')
                return redirect('order_complete')

    # Pass the cart details (subtotal, total, quantity) to the context for use in the template
    context = {
        'address_form': address_form,
        'personal_form': personal_form,
        'customer_address': address,
        'subtotal': subtotal,
        'total': total,
        'quantity': quantity,
    }
    return render(request, 'customer/checkout.html', context)

# View for the order completion page
def order_complete(request):
    return render(request, 'order_complete.html')

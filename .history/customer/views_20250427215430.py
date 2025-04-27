
# customer/views.py

from restaurant.models import Restaurant 
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import AddressForm, PersonalDetailsForm, PaymentMethodForm
from .models import Address
from django.contrib import messages

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
    payment_form = PaymentMethodForm()

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
            # Process Payment method form
            payment_form = PaymentMethodForm(request.POST)
            if payment_form.is_valid():
                payment_method = payment_form.cleaned_data['payment_method']
                # Here you can store the payment method to the order, or trigger any payment-related process
                messages.success(request, f'Payment method {payment_method} selected!')
                return redirect('order_complete')

    context = {
        'address_form': address_form,
        'personal_form': personal_form,
        'payment_form': payment_form,
        'customer_address': address,
    }
    return render(request, 'checkout.html', context)

# View to handle saving personal details
@login_required
def update_personal_details(request):
    if request.method == 'POST':
        personal_form = PersonalDetailsForm(request.POST, instance=request.user)
        if personal_form.is_valid():
            personal_form.save()
            messages.success(request, 'Personal details updated successfully!')
            return redirect('checkout')
    return redirect('checkout')

# View for finalizing the order (payment processing)
@login_required
def finalize_order(request):
    if request.method == 'POST':
        payment_method = request.POST.get('payment_method')
        # Here we would integrate with a payment provider or handle the order status
        # For example, save the order in the database and set it as 'pending'
        # Assume an Order model exists:
        # order = Order.objects.create(user=request.user, payment_method=payment_method, status='pending')
        messages.success(request, f'Order placed with {payment_method} payment method!')
        return redirect('order_complete')
    return redirect('checkout')

# View for the order completion page
def order_complete(request):
    return render(request, 'order_complete.html')
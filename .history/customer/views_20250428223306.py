
# customer/views.py

from restaurant.models import Restaurant 
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import AddressForm, PersonalDetailsForm, PaymentMethodForm
from .models import Address
from django.contrib import messages
from django.http import JsonResponse
from menu.models import CartItem

def vendor_list(request):
    restaurants = Restaurant.objects.all()
    return render(request, 'customer/vendor_list.html', {'restaurants': restaurants})

# View to handle the checkout page
@login_required
def checkout(request):
    # Get the restaurant_id from the session
    restaurant_id = request.session.get('restaurant_id')

    if not restaurant_id:
        messages.error(request, 'No restaurant selected.')
        return redirect('vendor_list')  # Or another fallback page

    try:
        restaurant = Restaurant.objects.get(id=restaurant_id)
    except Restaurant.DoesNotExist:
        messages.error(request, 'Restaurant not found.')
        return redirect('vendor_list')

    # Get the customer's current address, or create a new one
    address = Address.objects.filter(user=request.user).first()
    address_form = AddressForm(instance=address)
    personal_form = PersonalDetailsForm(instance=request.user)
    payment_form = PaymentMethodForm()



    # Fetch cart items from the CartItem model for the current user and the selected restaurant
    cart_items = CartItem.objects.filter(user=request.user, restaurant_id=restaurant_id).select_related('product')
    subtotal = sum(item.subtotal() for item in cart_items)
    total_quantity = sum(item.quantity for item in cart_items)

    total = subtotal + 39 + 29 # Assuming a fixed delivery fee of 39

    if request.method == 'POST':
        if 'address-submit' in request.POST:
            address_form = AddressForm(request.POST, instance=address)
            if address_form.is_valid():
                address = address_form.save(commit=False)  # Create but don't commit to DB yet
                if not address.user_id:  # Assign the user if it's a new address
                    address.user = request.user
                address.save()
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
                # Store the payment method or trigger any payment-related process
                messages.success(request, f'Payment method {payment_method} selected!')
                return redirect('order_complete')

    # Pass the cart details (subtotal, total, quantity) to the context for use in the template
    context = {
        'address_form': address_form,
        'personal_form': personal_form,
        'payment_form': payment_form,
        'customer_address': address,
        'subtotal': subtotal,
        'total': total,
        'quantity': total_quantity,
        'cart_items': cart_items,  # Add cart_items to context
        'restaurant': restaurant,  # Add restaurant to context if needed
    }
    return render(request, 'customer/checkout.html', context)



# View to handle saving personal details
def update_personal_details(request):
    if request.method == 'POST':
        personal_form = PersonalDetailsForm(request.POST, instance=request.user)
        if personal_form.is_valid():
            personal_form.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'message': 'Invalid form.'})
    return JsonResponse({'success': False, 'message': 'Invalid request.'})

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

# View to handle address saving
@login_required
def save_address(request):
    if request.method == 'POST':
        # Check if the user already has an address, otherwise create a new one
        address = Address.objects.filter(user=request.user).first()
        if not address:
            address = Address(user=request.user)  # Create a new Address object if none exists
        
        # Pass the POST data to the form (including the address generated by Google Maps)
        form = AddressForm(request.POST, instance=address)
        
        if form.is_valid():
            form.save()
            return JsonResponse({'success': True})

        return JsonResponse({'success': False, 'message': 'Address update failed.'})

    return JsonResponse({'success': False, 'message': 'Invalid request.'})


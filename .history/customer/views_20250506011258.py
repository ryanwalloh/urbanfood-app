
# customer/views.py

from restaurant.models import Restaurant 
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .forms import AddressForm, PersonalDetailsForm, PaymentMethodForm
from .models import Address, Customer
from django.contrib import messages
from django.http import JsonResponse
from menu.models import CartItem
from orders.models import Order, OrderLine
from django.shortcuts import get_object_or_404
from django.db.models import Sum
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


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

    # Debugging: Print restaurant and cart info
    print(f"Restaurant selected: {restaurant.name}")

    # Get the customer's current address, or create a new one
    address = Address.objects.filter(user=request.user).first()
    address_form = AddressForm(instance=address)
    personal_form = PersonalDetailsForm(instance=request.user)
    payment_form = PaymentMethodForm()

    # Fetch cart items from the CartItem model for the current user and the selected restaurant
    cart_items = CartItem.objects.filter(user=request.user, restaurant_id=restaurant_id).select_related('product')
    subtotal = sum(item.subtotal() for item in cart_items)
    total_quantity = sum(item.quantity for item in cart_items)

    # Debugging: Print cart info
    print(f"Cart items: {cart_items}")
    print(f"Subtotal: {subtotal}, Total quantity: {total_quantity}")

    total = subtotal + 39 + 29  # Assuming a fixed delivery fee of 39

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
            personal_form = PersonalDetailsForm(request.POST, instance=request.user)
            if personal_form.is_valid():
                personal_form.save()  # No need to manually update customer anymore
                messages.success(request, 'Personal details updated successfully!')
                return redirect('checkout')

        elif 'payment-submit' in request.POST:
            # Capture the selected payment method from the POST data
            payment_method = request.POST.get('payment_method')
            if payment_method:
                # Debugging: Print the selected payment method
                print(f"Payment method selected: {payment_method}")
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
@login_required
def update_personal_details(request):
    if request.method == 'POST':
        personal_form = PersonalDetailsForm(request.POST, instance=request.user)
        if personal_form.is_valid():
            personal_form.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'message': 'Invalid form.'})
    return JsonResponse({'success': False, 'message': 'Invalid request.'})

@login_required
def finalize_order(request):
    print("Finalizing order...")
    if request.method == 'POST':
        payment_method = request.POST.get('payment_method')

        cart_items = CartItem.objects.filter(user=request.user)

        if not cart_items.exists():
            messages.error(request, 'Your cart is empty.')
            return redirect('checkout')

        # Assume all items are from the same restaurant
        restaurant = cart_items.first().restaurant

        # Calculate total amount
        total = sum(item.subtotal() for item in cart_items)
        rider_fee = 39  # You can set logic here if needed
        small_order_fee = 29 if total < 200 else 0  # Example: apply small order fee if total < 200

        # Debugging: Print order calculation details
        print(f"Total amount before fees: {total}, Rider fee: {rider_fee}, Small order fee: {small_order_fee}")
        print(f"Restaurant selected: {restaurant.name}")

        # Begin the Order creation process
        try:
            # Create the Order
            order = Order.objects.create(
                customer=request.user,
                restaurant=restaurant.user,  # Ensure this is the correct User linked to the Restaurant
                total_amount=total + rider_fee + small_order_fee,
                rider_fee=rider_fee,
                small_order_fee=small_order_fee,
                payment_method=payment_method,
                status='pending',
            )

            # Debugging: Print the order details
            print(f"Order created: {order}, Payment method: {payment_method}")

            # Create OrderLine entries
            for item in cart_items:
                OrderLine.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    subtotal=item.subtotal(),
                )

            # Clear the cart after order is successfully created
            cart_items.delete()

            # Debugging: Print the cart items that were cleared
            print(f"Cart items cleared: {cart_items}")

            # Broadcast the new order to the restaurant group
            channel_layer = get_channel_layer()
            group_name = f"orders_{restaurant.id}"  # Create a unique group for the restaurant
            async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'order_update',  # Matches method in OrderConsumer
                'order': {
                    'id': order.id,
                    'token_number': order.token_number,
                    'status': order.status,
                    'customer_name': order.customer.get_full_name(),
                    'address': str(order.customer.customer.address),
                    'total_amount': order.total_amount,
                    'created_at': order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'items': [
                        {
                            'product_name': line.product.name,
                            'quantity': line.quantity
                        }
                        for line in order.items.all()
                    ],
                    'rider': None,
                    'rider_name': None,
                    'rider_phone': None
                }
            }
        )

            messages.success(request, f'Order placed successfully with {payment_method}!')
            return redirect('order_complete', order_id=order.id)

        except Exception as e:
            messages.error(request, f'Error creating order: {str(e)}')
            print(f"Error during order creation: {str(e)}")
            return redirect('checkout')

    return redirect('checkout')

@login_required
def order_complete(request, order_id):
    try:
        customer = get_object_or_404(Customer, user=request.user)
        order = Order.objects.select_related('restaurant', 'customer').get(id=order_id, customer=request.user)
        order_lines = OrderLine.objects.filter(order=order).select_related('product')
        
        address = Address.objects.filter(user=request.user).first()
        restaurant = get_object_or_404(Restaurant, user=order.restaurant)
        
        profile_picture = restaurant.restaurantprofile.profile_picture if hasattr(restaurant, 'restaurantprofile') else None
        
        total_subtotal = order_lines.aggregate(total_subtotal=Sum('subtotal'))['total_subtotal'] or 0
        

        context = {
            'order': order,
            'order_lines': order_lines,
            'restaurant': restaurant,
            'address': address,
            'total_subtotal': total_subtotal,
            'profile_picture': profile_picture,
        }
        return render(request, 'customer/order_tracking.html', context)

    except Exception as e:
        print(e)  # Optional: useful in dev
        messages.error(request, 'Order not found or unexpected error occurred.')
        return render(request, 'core/landing_page.html',)


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
            updated_address = form.save()  # Save the form and get the updated address instance

            # Return the updated address data in the response
            return JsonResponse({
                'success': True,
                'label': updated_address.label,  # Send the updated label
                'street': updated_address.street,  # Send the updated street
                'barangay': updated_address.barangay,  # Send the updated barangay
                'note': updated_address.note,  # Send any additional note if needed
            })

        return JsonResponse({'success': False, 'message': 'Address update failed.'})

    return JsonResponse({'success': False, 'message': 'Invalid request.'})


logger = logging.getLogger(__name__)

@login_required
def get_order_status(request, order_id):
    try:
        # Log the request user and order ID for debugging
        logger.debug(f"Request user: {request.user}, Order ID: {order_id}")

        # Ensure the user has a customer object
        if not hasattr(request.user, 'customer'):
            logger.error(f"User {request.user.username} does not have a related customer object.")
            return JsonResponse({'error': 'Customer data not found'}, status=404)

        # Now use the actual user instance to filter the order
        order = Order.objects.get(id=order_id, customer=request.user)
        print(f"Order ID: {order_id} - Status: {order.status}")

        return JsonResponse({'status': order.status})
    
    except Order.DoesNotExist:
        logger.error(f"Order with ID {order_id} not found for user {request.user.username}")
        return JsonResponse({'error': 'Order not found'}, status=404)
    
    except Exception as e:
        logger.error(f"Unexpected error when fetching order status for order {order_id} and user {request.user.username}: {str(e)}")
        print(f"Order ID: {order_id} not found")
        return JsonResponse({'error': 'Internal Server Error'}, status=500)
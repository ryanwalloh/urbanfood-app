from django.shortcuts import render

# Create your views here.
def dashboard(request):
    return render(request, 'demo/dashboard.html')


def pending_orders(request):
    # Optional: Restrict to admin users only
    if request.user.role != 'demo':
        return HttpResponseForbidden("Demo only")

    pending_orders = Order.objects.filter(status='pending').select_related('restaurant', 'customer')

    order_data = []
    for order in pending_orders:
        items = order.orderline_set.select_related('product').all()
        order_data.append({
            'id': order.id,
            'token_number': order.token_number,
            'created_at': order.created_at.isoformat(),
            'customer_name': order.customer.name if order.customer else 'Unknown',
            'customer_address': {
                'barangay': getattr(getattr(order.customer, 'address', None), 'barangay', '')
            },
            'restaurant_profile': order.restaurant.restaurant.profile_picture.url
                if hasattr(order.restaurant, 'restaurant') and order.restaurant.restaurant.profile_picture else '/static/default.png',
            'total_amount': str(order.total_amount),
            'items': [{
                'product': {
                    'name': item.product.name
                },      
                'quantity': item.quantity
            } for item in items]
        })

    return JsonResponse({'orders': order_data})
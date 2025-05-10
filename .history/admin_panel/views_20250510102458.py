from django.db.models import Count
from orders.models import Order
from restaurant.models import Restaurant

def admin_dashboard(request):
    if not request.user.is_authenticated or request.user.role != 'admin':
        return redirect('core:login')

    restaurants = Restaurant.objects.all()

    # Count total orders
    total_orders = Order.objects.count()

    # Annotate each restaurant with its related order count
    restaurant_data = []
    for restaurant in restaurants:
        order_count = Order.objects.filter(restaurant=restaurant.user).count()
        restaurant_data.append({
            'name': restaurant.name,
            'profile_picture': restaurant.profile_picture.url if restaurant.profile_picture else '/static/default.png',
            'order_count': order_count,
        })

    context = {
        'total_orders': total_orders,
        'restaurant_data': restaurant_data,
    }
    return render(request, 'admin_panel/dashboard.html', context)

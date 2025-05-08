from django.urls import path
from . import views

app_name = 'rider'

urlpatterns = [
    path('dashboard/', views.rider_dashboard, name='rider_dashboard'),
    path('toggle-status/', views.toggle_status, name='toggle_status'),
    path('rider/orders/count/', views.get_available_orders, name='get_order_count'),
    path('orders/', views.orders_view, name='orders'),
    path('fetch-orders/', views.fetch_orders, name='fetch-orders'),
path('rider-dashboard/', views.dashboard_view, name='dashboard'),
    path('update-order-status/', views.update_order_status, name='update_order_status'),
    path('orders/deliver/', views.deliver, name='deliver'),
    path('fetch-order-details/', views.fetch_order_details, name='fetch-order-details'),
    path('rider/add_earnings/', views.add_rider_earnings, name='add_earnings'),
    path('fetch_updated_earnings/', views.fetch_updated_earnings, name='fetch_updated_earnings'),
]

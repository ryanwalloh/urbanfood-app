from django.urls import path
from . import views

app_name = 'rider'

urlpatterns = [
    path('dashboard/', views.rider_dashboard, name='rider_dashboard'),
    path('toggle-status/', views.toggle_status, name='toggle_status'),
    path('rider/orders/count/', views.get_available_orders, name='get_order_count'),
    path('orders/', views.orders_view, name='orders'),
    path('fetch-orders/', views.fetch_orders, name='fetch-orders'),
]

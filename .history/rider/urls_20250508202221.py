from django.urls import path
from . import views

app_name = 'rider'

urlpatterns = [
    path('dashboard/', views.rider_dashboard, name='rider_dashboard'),
    path('toggle-status/', views.toggle_status, name='toggle_status'),
    path('rider/orders/count/', views.get_available_orders, name='get_order_count'),
]

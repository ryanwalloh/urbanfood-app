# customer/urls.py
from django.urls import path
from . import views
from .views import get_order_status

urlpatterns = [
    path('vendors/', views.vendor_list, name='vendor_list'),
    path('checkout/', views.checkout, name='checkout'),
    path('update_personal_details/', views.update_personal_details, name='update_personal_details'),
    path('finalize_order/', views.finalize_order, name='finalize_order'),
    path('order_complete/<int:order_id>/', views.order_complete, name='order_complete'),
    path('save_address/', views.save_address, name='save_address'),
    path('api/order-status/<int:order_id>/', get_order_status, name='get_order_status'),
    
]
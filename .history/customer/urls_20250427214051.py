# customer/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('vendors/', views.vendor_list, name='vendor_list'),
    path('checkout/', views.checkout, name='checkout'),
    path('update_personal_details/', views.update_personal_details, name='update_personal_details'),
    path('finalize_order/', views.finalize_order, name='finalize_order'),
    path('order_complete/', views.order_complete, name='order_complete'),
]
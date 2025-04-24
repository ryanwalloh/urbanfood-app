# customer/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('vendors/', views.vendor_list, name='vendor_list'),
]
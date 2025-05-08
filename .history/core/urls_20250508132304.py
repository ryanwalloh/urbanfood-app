# core/urls.py
from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.landing_page, name='landing_page'),
    path('request-magic-link/', views.request_magic_link, name='request_magic_link'),
    path('magic-link-login/<uuid:token>/', views.magic_link_login, name='magic_link_login'),
    path('customer-home/', views.customer_home, name='customer_home'),
    path('restaurant-home/', views.restaurant_home, name='restaurant_home'),
    path('rider-home/', views.rider_home, name='rider_home'),
]
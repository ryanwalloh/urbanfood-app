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
    path('loginByPassword/', views.login_by_password, name='login_by_password'),
    path('registerAccount/', views.register_account, name='register_account'),
    path('getRestaurants/', views.get_restaurants, name='get_restaurants'),
    path('getRestaurantProducts/<int:restaurant_id>/', views.get_restaurant_products, name='get_restaurant_products'),
    path('addToCart/', views.add_to_cart, name='add_to_cart'),
    path('removeFromCart/', views.remove_from_cart, name='remove_from_cart'),
    path('getUserAddress/', views.get_user_address, name='get_user_address'),
    path('saveAddress/', views.save_address, name='save_address'),
    path('updatePersonalDetails/', views.update_personal_details, name='update_personal_details'),
    path('dashboard/', views.dashboard, name='dashboard'),
]
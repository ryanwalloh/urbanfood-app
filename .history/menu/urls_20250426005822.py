from django.urls import path
from . import views

app_name = 'menu'

urlpatterns = [
    path('cart/add/json/', views.add_to_cart_json, name='menu:add_to_cart_json'),
]

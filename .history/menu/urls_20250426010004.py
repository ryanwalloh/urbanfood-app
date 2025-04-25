from django.urls import path
from . import views

app_name = 'menu'

urlpatterns = [
   path('add-to-cart/', views.add_to_cart_json, name='add_to_cart_json'),
]

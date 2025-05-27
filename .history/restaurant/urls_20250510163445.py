from django.urls import path
from . import views

urlpatterns = [
    path('<int:restaurant_id>/', views.restaurant_detail, name='restaurant_detail'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('order/<int:order_id>/accept/', views.accept_order, name='accept_order'),
    path('order/<int:order_id>/reject/', views.reject_order, name='reject_order'),
    path('pending-orders/', views.get_pending_orders, name='get_pending_orders'),
     path('add-product/', views.add_product, name='add_product'), 
   # ← updated
]

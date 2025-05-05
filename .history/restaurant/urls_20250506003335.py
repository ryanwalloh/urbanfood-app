from django.urls import path
from . import views

urlpatterns = [
    path('<int:restaurant_id>/', views.restaurant_detail, name='restaurant_detail'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('order/<int:order_id>/accept/', views.accept_order, name='accept_order'),
    path('order/<int:order_id>/reject/', views.reject_order, name='reject_order'),
    path('order/<int:order_id>/mark-ready/', views.mark_order_ready, name='mark_ready'),
   
    path('dashboard/', views.restaurant_dashboard, name='restaurant_dashboard'),
    path('order/<int:order_id>/arrived/', views.mark_order_arrived, name='mark_order_arrived'),
]

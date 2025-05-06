from django.urls import path
from . import views

urlpatterns = [
    path('prepare/', views.prepare_order, name='prepare_order'),
    path('arrived/', views.mark_order_arrived, name='mark_order_arrived'),
    path('ready/', views.mark_order_ready, name='mark_order_ready'),
    path('pending/', views.get_pending_orders, name='get_pending_orders'),
]

from django.urls import path
from . import views

app_name = 'demo'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
     path('pending-orders/', views.pending_orders_view, name='admin_pending_orders'),
]
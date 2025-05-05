from django.urls import path
from . import views

urlpatterns = [
    path('prepare/', views.prepare_order, name='prepare_order'),
]

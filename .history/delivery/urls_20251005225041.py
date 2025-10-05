from django.urls import path
from . import views

app_name = 'delivery'

urlpatterns = [
    path('update-rider-location/', views.update_rider_location, name='update_rider_location'),
    path('rider-location/<int:rider_id>/', views.get_rider_location, name='get_rider_location'),
]

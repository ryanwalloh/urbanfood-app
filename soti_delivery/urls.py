"""
URL configuration for soti_delivery project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import UserViewSet
from menu.views import ProductViewSet
from orders.views import OrderViewSet, OrderLineViewSet
from delivery.views import RiderLocationViewSet
from core import views
from django.conf import settings
from django.conf.urls.static import static 
from django.views.static import serve
from django.urls import re_path

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-lines', OrderLineViewSet)
router.register(r'rider-locations', RiderLocationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('', include('core.urls')),
    path('customer/', views.customer_home, name='customer-home'),
    path('restaurant/', views.restaurant_home, name='restaurant-home'),
    path('rider/', views.rider_home, name='rider-home'),
    path('restaurants/', include(('restaurant.urls', 'restaurant'), namespace='restaurant')),

    path('customer/', include('customer.urls')),
    path('menu/', include('menu.urls')),
    path('orders/', include('orders.urls')),
    
    path('rider/', include('rider.urls')),
    path('delivery/', include('delivery.urls')),

    path('demo/', include('demo.urls')),
    path('users/', include('users.urls')),
   
    

]

# Media files (for file uploads)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]
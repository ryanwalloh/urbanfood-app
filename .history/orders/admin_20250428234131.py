from django.contrib import admin

# Register your models here.
from .models import Order, OrderLine
# Register your models here.
admin.site.register(Order)
admin.site.register(OrderLine)

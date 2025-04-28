from django.contrib import admin

# Register your models here.
from .models import Address, Customer
# Register your models here.
admin.site.register(Customer)
admin.site.register(Address)
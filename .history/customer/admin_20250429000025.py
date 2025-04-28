from django.contrib import admin
from .models import Address
from .models import Customer
# Register your models here.

admin.site.register(Address)

class CustomerAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'address')  # Customize the fields you want to display

admin.site.register(Customer, CustomerAdmin)
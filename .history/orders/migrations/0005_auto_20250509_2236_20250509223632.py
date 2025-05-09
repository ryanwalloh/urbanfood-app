# orders/migrations/000X_populate_token_numbers.py

from django.db import migrations
import random
import string

def generate_token():
    return ''.join(random.choices(string.digits, k=6))

def populate_tokens(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    for order in Order.objects.all():
        order.token_number = generate_token()
        order.save()

class Migration(migrations.Migration):

    dependencies = [
        ('orders', '000X_previous'),  # Replace with actual last migration
    ]

    operations = [
        migrations.RunPython(populate_tokens),
    ]
# orders/migrations/000X_populate_token_numbers.py

from django.db import migrations
import random
import string

def generate_token():
    return ''.join(random.choices(string.digits, k=6))

def populate_tokens(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    for order in Order.objects.all():
        order.token_number = generate_token()
        order.save()

class Migration(migrations.Migration):

    dependencies = [
        ('orders', '000X_previous'),  # Replace with actual last migration
    ]

    operations = [
        migrations.RunPython(populate_tokens),
    ]

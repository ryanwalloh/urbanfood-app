# Generated migration for Stripe integration
# Run: python manage.py makemigrations
# Then: python manage.py migrate

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='stripe_payment_intent_id',
            field=models.CharField(blank=True, help_text='Stripe Payment Intent ID', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='stripe_client_secret',
            field=models.CharField(blank=True, help_text='Stripe Client Secret for payment sheet', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='stripe_charge_id',
            field=models.CharField(blank=True, help_text='Stripe Charge ID', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_status',
            field=models.CharField(choices=[('pending', 'Pending'), ('succeeded', 'Succeeded'), ('failed', 'Failed'), ('cancelled', 'Cancelled'), ('refunded', 'Refunded')], default='pending', help_text='Payment processing status', max_length=20),
        ),
    ]

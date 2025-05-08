# rider/models.py
from django.conf import settings
from django.db import models

from datetime import datetime, timedelta
from django.utils import timezone

class Rider(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vehicle_type = models.CharField(max_length=30)
    license_number = models.CharField(max_length=50)
    phone = models.CharField(max_length=15)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.user.username
    
class RiderEarnings(models.Model):
    rider = models.ForeignKey(Rider, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
 earned_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.rider.user.username} - {self.amount} on {self.earned_at}"

    @staticmethod
    def get_total_earnings(rider):
        return RiderEarnings.objects.filter(rider=rider).aggregate(models.Sum('amount'))['amount__sum'] or 0

    @staticmethod
    def get_daily_earnings(rider):
        today = datetime.today().date()
        return RiderEarnings.objects.filter(rider=rider, earned_at__date=today).aggregate(models.Sum('amount'))['amount__sum'] or 0

    @staticmethod
    def get_weekly_earnings(rider):
        start_of_week = datetime.today() - timedelta(days=datetime.today().weekday())
        return RiderEarnings.objects.filter(rider=rider, earned_at__gte=start_of_week).aggregate(models.Sum('amount'))['amount__sum'] or 0

    @staticmethod
    def get_monthly_earnings(rider):
        start_of_month = datetime.today().replace(day=1)
        return RiderEarnings.objects.filter(rider=rider, earned_at__gte=start_of_month).aggregate(models.Sum('amount'))['amount__sum'] or 0
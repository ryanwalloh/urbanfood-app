from django.db import models
from users.models import User

class RiderLocation(models.Model):
    rider = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'role': 'rider'})
    latitude = models.FloatField()
    longitude = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

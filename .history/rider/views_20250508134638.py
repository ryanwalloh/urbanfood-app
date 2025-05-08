from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from rider.models import Rider
from .models import Rider, RiderEarnings

@require_POST
@login_required
def toggle_status(request):
    rider = Rider.objects.get(user=request.user)
    rider.is_available = not rider.is_available
    rider.save()
    return JsonResponse({
        'new_status': 'Online' if rider.is_available else 'Offline',
        'status_image': f"{'online' if rider.is_available else 'offline'}.png"
    })

@login_required
def rider_dashboard(request):
    rider = Rider.objects.get(user=request.user)

    total_earnings = RiderEarnings.get_total_earnings(rider)
    daily_earnings = RiderEarnings.get_daily_earnings(rider)
    weekly_earnings = RiderEarnings.get_weekly_earnings(rider)
    monthly_earnings = RiderEarnings.get_monthly_earnings(rider)

    context = {
        'rider': rider,
        'total_earnings': total_earnings,
        'daily_earnings': daily_earnings,
        'weekly_earnings': weekly_earnings,
        'monthly_earnings': monthly_earnings,
    }

    return render(request, 'rider/dashboard.html', context)
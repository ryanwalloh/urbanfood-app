from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from rider.models import Rider

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

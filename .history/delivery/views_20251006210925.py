from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
from .models import RiderLocation
from .serializers import RiderLocationSerializer

class RiderLocationViewSet(viewsets.ModelViewSet):
    queryset = RiderLocation.objects.all()
    serializer_class = RiderLocationSerializer

@csrf_exempt
def update_rider_location(request):
    """
    Update or create rider location when accepting an order
    """
    if request.method != 'POST':
        return JsonResponse({
            'success': False,
            'error': 'Only POST method is allowed'
        }, status=405)
    
    try:
        # Check authentication
        if not request.user.is_authenticated:
            return JsonResponse({
                'success': False,
                'error': 'Authentication required'
            }, status=401)
        
        rider = request.user
        
        # Check if user is a rider
        if rider.role != 'rider':
            return JsonResponse({
                'success': False,
                'error': 'Only riders can update location'
            }, status=403)
        
        # Get latitude and longitude from request
        if request.content_type == 'application/json':
            import json
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError:
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid JSON format'
                }, status=400)
        else:
            data = request.POST
        
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not latitude or not longitude:
            return JsonResponse({
                'success': False,
                'error': 'Latitude and longitude are required'
            }, status=400)
        
        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'error': 'Invalid latitude or longitude format'
            }, status=400)
        
        # Update or create rider location
        rider_location, created = RiderLocation.objects.update_or_create(
            rider=rider,
            defaults={
                'latitude': latitude,
                'longitude': longitude
            }
        )
        
        action = 'created' if created else 'updated'
        
        return JsonResponse({
            'success': True,
            'message': f'Rider location {action} successfully',
            'rider_location': {
                'rider_id': rider.id,
                'latitude': rider_location.latitude,
                'longitude': rider_location.longitude,
                'updated_at': rider_location.updated_at.isoformat()
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': f'Failed to update rider location: {str(e)}'
        }, status=500)

@csrf_exempt
def get_rider_location(request, rider_id):
    """
    Get current rider location for customer tracking
    """
    if request.method != 'GET':
        return JsonResponse({
            'success': False,
            'error': 'Only GET method is allowed'
        }, status=405)
    
    try:
        from users.models import User
        
        print(f'Getting rider location for rider ID: {rider_id}')
        
        # Get the rider user
        try:
            rider = User.objects.get(id=rider_id, role='rider')
            print(f'Found rider: {rider.first_name} {rider.last_name}')
        except User.DoesNotExist:
            print(f'Rider not found with ID: {rider_id}')
            return JsonResponse({
                'success': False,
                'error': 'Rider not found'
            }, status=404)
        
        # Get rider location
        try:
            rider_location = RiderLocation.objects.get(rider=rider)
            print(f'Found rider location: {rider_location.latitude}, {rider_location.longitude}')
            return JsonResponse({
                'success': True,
                'location': {
                    'rider_id': rider.id,
                    'latitude': rider_location.latitude,
                    'longitude': rider_location.longitude,
                    'updated_at': rider_location.updated_at.isoformat()
                }
            })
        except RiderLocation.DoesNotExist:
            print(f'No location found for rider ID: {rider_id}')
            return JsonResponse({
                'success': False,
                'error': 'Rider location not found - rider may not have updated their location yet'
            }, status=404)
        
    except Exception as e:
        import traceback
        print(f'❌ Error getting rider location: {e}')
        print(f'❌ Traceback: {traceback.format_exc()}')
        return JsonResponse({
            'success': False,
            'error': f'Failed to get rider location: {str(e)}'
        }, status=500)

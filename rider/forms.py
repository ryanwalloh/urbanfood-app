# rider/forms.py
from django import forms
from .models import Rider

class RiderProfileForm(forms.ModelForm):
    """Form for updating rider profile information including profile picture"""
    
    class Meta:
        model = Rider
        fields = ['vehicle_type', 'license_number', 'phone', 'profile_picture']
        widgets = {
            'vehicle_type': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'e.g., Motorcycle, Bicycle, Car'
            }),
            'license_number': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Enter your license number'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Enter your phone number'
            }),
            'profile_picture': forms.FileInput(attrs={
                'class': 'form-file-input',
                'accept': 'image/*'
            })
        }
        labels = {
            'vehicle_type': 'Vehicle Type',
            'license_number': 'License Number',
            'phone': 'Phone Number',
            'profile_picture': 'Profile Picture'
        }
        help_texts = {
            'profile_picture': 'Upload a clear photo of yourself. Recommended size: 400x400 pixels.'
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make profile_picture field optional
        self.fields['profile_picture'].required = False

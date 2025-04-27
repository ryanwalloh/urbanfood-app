from django import forms
from .models import Address
from django.contrib.auth.models import User

# Form for Address
class AddressForm(forms.ModelForm):
    class Meta:
        model = Address
        fields = ['street', 'barangay', 'note', 'label']
        widgets = {
            'street': forms.TextInput(attrs={'placeholder': 'Street'}),
            'barangay': forms.TextInput(attrs={'placeholder': 'Barangay'}),
            'note': forms.TextInput(attrs={'placeholder': 'Additional note'}),
            'label': forms.Select(),
        }

# Form for updating Personal Details
class PersonalDetailsForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']

# Form for Payment Method (could be extended with specific models later)
class PaymentMethodForm(forms.Form):
    payment_method_choices = [
        ('maya', 'Maya'),
        ('credit', 'Credit / Debit Card'),
        ('COD', 'Cash on Delivery')
    ]
    payment_method = forms.ChoiceField(choices=payment_method_choices, widget=forms.RadioSelect)

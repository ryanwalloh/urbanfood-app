from django import forms
from .models import Address
from django.contrib.auth.models import User

# Form for Address
class AddressForm(forms.ModelForm):
    class Meta:
        model = Address
        fields = ['street', 'barangay', 'note', 'label']
        widgets = {
            'street': forms.TextInput(),  # No placeholder here
            'barangay': forms.TextInput(),  # No placeholder here
            'note': forms.TextInput(),  # No placeholder here
            'label': forms.Select(),
        }
# Form for updating Personal Details
class PersonalDetailsForm(forms.ModelForm):
    
    phone = forms.CharField(max_length=15, required=True, widget=forms.TextInput(attrs={'placeholder': 'Mobile Number', 'class': 'number'}))
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone'] 
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'name'}),
            'last_name': forms.TextInput(attrs={ 'class': 'name'}),
            'email': forms.EmailInput(attrs={'class': 'email'}),
           
        }




# Form for Payment Method (could be extended with specific models later)
class PaymentMethodForm(forms.Form):
    payment_method_choices = [
        ('maya', 'Maya'),
        ('credit', 'Credit / Debit Card'),
        ('bank', 'Credit / Bank Transfer'),
        ('COD', 'Cash on Delivery')
    ]
    payment_method = forms.ChoiceField(choices=payment_method_choices, widget=forms.RadioSelect)

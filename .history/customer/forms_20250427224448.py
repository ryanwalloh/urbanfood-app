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
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']
        widgets = {
            'first_name': forms.TextInput(attrs={'placeholder': 'First Name', 'class': 'custom-class'}),
            'last_name': forms.TextInput(attrs={'placeholder': 'Last Name', 'class': 'custom-class'}),
            'email': forms.EmailInput(attrs={'placeholder': 'Email', 'class': 'custom-class'}),
        }

    def __init__(self, *args, **kwargs):
        super(PersonalDetailsForm, self).__init__(*args, **kwargs)
        
        # Add custom labels with classes
        self.fields['first_name'].label = "First Name"
        self.fields['first_name'].label_class="floating-label"
        
        self.fields['last_name'].label = "Last Name"
        self.fields['last_name'].label_class="floating-label"
        
        self.fields['email'].label = "Email"
        self.fields['email'].label_class="floating-label"


# Form for Payment Method (could be extended with specific models later)
class PaymentMethodForm(forms.Form):
    payment_method_choices = [
        ('maya', 'Maya'),
        ('credit', 'Credit / Debit Card'),
        ('COD', 'Cash on Delivery')
    ]
    payment_method = forms.ChoiceField(choices=payment_method_choices, widget=forms.RadioSelect)

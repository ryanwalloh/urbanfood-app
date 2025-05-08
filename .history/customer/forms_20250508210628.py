from django import forms
from .models import Address, Customer
from django.contrib.auth.models import User

# Form for Address
class AddressForm(forms.ModelForm):
    class Meta:
        model = Address
        fields = ['street', 'baranggay', 'note', 'label']
        widgets = {
            'street': forms.TextInput(),  # No placeholder here
            'barangay': forms.TextInput(),  # No placeholder here
            'note': forms.TextInput(),  # No placeholder here
            'label': forms.Select(),
        }
# Form for updating Personal Details
class PersonalDetailsForm(forms.ModelForm):
    phone = forms.CharField(max_length=15, required=True, widget=forms.TextInput(attrs={'class': 'number'}))

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email']  # Remove 'phone' from here!
        widgets = {
            'first_name': forms.TextInput(attrs={'class': 'name'}),
            'last_name': forms.TextInput(attrs={'class': 'name'}),
            'email': forms.EmailInput(attrs={'class': 'email'}),
        }

    def __init__(self, *args, **kwargs):
        # Custom initialization to load initial phone from Customer
        user = kwargs.get('instance')
        super().__init__(*args, **kwargs)
        if user:
            try:
                self.fields['phone'].initial = user.customer.phone
            except Customer.DoesNotExist:
                pass  # It's okay if no Customer yet

    def save(self, commit=True):
        user = super().save(commit)
        phone = self.cleaned_data.get('phone')
        if phone:
            customer, created = Customer.objects.get_or_create(user=user)
            customer.phone = phone
            customer.save()
        return user



# Form for Payment Method (could be extended with specific models later)
class PaymentMethodForm(forms.Form):
    payment_method_choices = [
        ('maya', 'Maya'),
        ('credit', 'Credit / Debit Card'),
        ('bank', 'Credit / Bank Transfer'),
        ('COD', 'Cash on Delivery')
    ]
    payment_method = forms.ChoiceField(choices=payment_method_choices, widget=forms.RadioSelect)

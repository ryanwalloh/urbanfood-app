from django.urls import path
from . import views

urlpatterns = [
    path('send-verification-code/', views.send_verification_code, name='send_verification_code'),
    path('verify-sms-code/', views.verify_sms_code, name='verify_sms_code'),
    path('resend-verification-code/', views.resend_verification_code, name='resend_verification_code'),
]

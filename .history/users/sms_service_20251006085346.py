from twilio.rest import Client
from django.conf import settings
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        self.account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        self.auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        self.from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '')
        self.last_error = None
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured")

    def normalize_phone_number(self, phone_number: str) -> str:
        """
        Normalize common local formats to E.164.
        Defaults to PH (+63) when a local mobile format is detected (09xxxxxxxxx or 9xxxxxxxxx).
        Otherwise, strips non-digits and prefixes '+'.
        """
        if not phone_number:
            return ''

        raw = str(phone_number).strip()
        # Already in E.164
        if raw.startswith('+'):
            return '+' + ''.join(ch for ch in raw if ch.isdigit())

        digits = ''.join(ch for ch in raw if ch.isdigit())

        # Heuristic for PH mobile numbers
        if len(digits) == 11 and digits.startswith('09'):
            return '+63' + digits[1:]
        if len(digits) == 10 and digits.startswith('9'):
            return '+63' + digits

        # Fallback: prefix '+'
        return '+' + digits

    def send_verification_code(self, phone_number, code, email=None):
        """
        Send SMS verification code to the provided phone number
        If SMS fails and email is provided, send email as fallback
        """
        sms_success = False
        email_success = False
        
        # Try SMS first
        if self.client:
            try:
                # Normalize phone number to E.164
                phone_number = self.normalize_phone_number(phone_number)

                message_body = f"Your SOTI Delivery verification code is: {code}. This code will expire in 5 minutes."

                message = self.client.messages.create(
                    body=message_body,
                    from_=self.from_number,
                    to=phone_number
                )

                logger.info(f"SMS sent successfully to {phone_number}. Message SID: {message.sid}")
                self.last_error = None
                sms_success = True
                return True

            except Exception as e:
                self.last_error = str(e)
                logger.error(f"Failed to send SMS to {phone_number}: {self.last_error}")
                sms_success = False
        else:
            logger.error("Twilio client not initialized")
            self.last_error = "Twilio client not initialized"
            sms_success = False

        # If SMS failed and email is provided, try email fallback
        if not sms_success and email:
            try:
                subject = 'SOTI Delivery - Verification Code'
                message = f"""
Hello,

Your SOTI Delivery verification code is: {code}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

Best regards,
SOTI Delivery Team
"""
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
                
                logger.info(f"Verification code sent via email to {email}")
                email_success = True
                self.last_error = None  # Clear error since email worked
                return True
                
            except Exception as e:
                logger.error(f"Failed to send verification email to {email}: {str(e)}")
                if not self.last_error:  # Keep SMS error if no email error
                    self.last_error = f"SMS failed and email failed: {str(e)}"
                email_success = False

        # If both SMS and email failed
        if not sms_success and not email_success:
            return False
            
        return True

    def is_configured(self):
        """
        Check if Twilio is properly configured
        """
        return bool(self.account_sid and self.auth_token and self.from_number)

# Create a singleton instance
sms_service = SMSService()

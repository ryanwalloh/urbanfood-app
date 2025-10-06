from twilio.rest import Client
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SMSService:
    def __init__(self):
        self.account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        self.auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        self.from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', '')
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured")

    def send_verification_code(self, phone_number, code):
        """
        Send SMS verification code to the provided phone number
        """
        if not self.client:
            logger.error("Twilio client not initialized")
            return False

        try:
            # Format phone number (ensure it starts with +)
            if not phone_number.startswith('+'):
                phone_number = '+' + phone_number.lstrip('+')

            message_body = f"Your SOTI Delivery verification code is: {code}. This code will expire in 5 minutes."

            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=phone_number
            )

            logger.info(f"SMS sent successfully to {phone_number}. Message SID: {message.sid}")
            return True

        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {str(e)}")
            return False

    def is_configured(self):
        """
        Check if Twilio is properly configured
        """
        return bool(self.account_sid and self.auth_token and self.from_number)

# Create a singleton instance
sms_service = SMSService()

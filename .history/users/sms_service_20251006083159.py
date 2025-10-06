from twilio.rest import Client
from django.conf import settings
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

    def send_verification_code(self, phone_number, code):
        """
        Send SMS verification code to the provided phone number
        """
        if not self.client:
            logger.error("Twilio client not initialized")
            return False

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
            return True

        except Exception as e:
            self.last_error = str(e)
            logger.error(f"Failed to send SMS to {phone_number}: {self.last_error}")
            return False

    def is_configured(self):
        """
        Check if Twilio is properly configured
        """
        return bool(self.account_sid and self.auth_token and self.from_number)

# Create a singleton instance
sms_service = SMSService()

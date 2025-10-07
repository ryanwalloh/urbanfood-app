from django.conf import settings
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)

class SMSService:
    """
    Email-first verification delivery. Twilio/SMS removed.
    Maintains the same interface so existing views keep working.
    """

    def __init__(self):
        self.last_error = None

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
        Send verification code via email only. Returns True on success.
        If email is missing, we log and return False.
        """
        if not email:
            self.last_error = 'Email address is required to send verification code'
            logger.error(self.last_error)
            return False

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
            self.last_error = None
            return True

        except Exception as e:
            self.last_error = f"Email failed: {str(e)}"
            logger.error(self.last_error)
            return False

    def is_configured(self):
        """
        Check if Twilio is properly configured
        """
        # Always True as we rely solely on SMTP/email
        return True

# Create a singleton instance
sms_service = SMSService()

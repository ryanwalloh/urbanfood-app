from django.conf import settings
from django.core.mail import send_mail
import logging
import requests

logger = logging.getLogger(__name__)

class SMSService:
    """
    Email-first verification delivery using Brevo API.
    Maintains the same interface so existing views keep working.
    """

    def __init__(self):
        self.last_error = None
        self.brevo_api_key = getattr(settings, 'BREVO_API_KEY', None)
        self.brevo_api_url = 'https://api.brevo.com/v3/smtp/email'

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
        Send verification code via Brevo email. Returns True on success.
        If email is missing, we log and return False.
        """
        if not email:
            self.last_error = 'Email address is required to send verification code'
            logger.error(self.last_error)
            return False

        try:
            # Try Brevo API first if API key is configured
            if self.brevo_api_key:
                return self._send_via_brevo(email, code)
            else:
                # Fallback to Django's send_mail (Resend backend)
                return self._send_via_django(email, code)

        except Exception as e:
            self.last_error = f"Email failed: {str(e)}"
            logger.error(self.last_error)
            return False

    def _send_via_brevo(self, email, code):
        """
        Send email using Brevo API
        """
        subject = 'SOTI Delivery - Verification Code'
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #F43332; color: white; padding: 20px; text-align: center; }}
        .content {{ background-color: #f9f9f9; padding: 30px; }}
        .code {{ background-color: white; border: 2px solid #F43332; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #F43332; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SOTI Delivery</h1>
        </div>
        <div class="content">
            <h2>Verification Code</h2>
            <p>Hello,</p>
            <p>Your SOTI Delivery verification code is:</p>
            <div class="code">{code}</div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>SOTI Delivery Team</p>
        </div>
    </div>
</body>
</html>
"""
        text_content = f"""Hello,

Your SOTI Delivery verification code is: {code}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

Best regards,
SOTI Delivery Team
"""

        from_email = getattr(settings, 'BREVO_FROM_EMAIL', 'noreply@sotidelivery.com')
        sender_name = getattr(settings, 'BREVO_FROM_NAME', 'SOTI Delivery')

        payload = {
            "sender": {
                "name": sender_name,
                "email": from_email
            },
            "to": [
                {
                    "email": email
                }
            ],
            "subject": subject,
            "htmlContent": html_content,
            "textContent": text_content
        }

        headers = {
            "Accept": "application/json",
            "api-key": self.brevo_api_key,
            "Content-Type": "application/json"
        }

        response = requests.post(self.brevo_api_url, json=payload, headers=headers, timeout=10)
        
        if response.status_code == 201:
            logger.info(f"Verification code sent via Brevo to {email}")
            self.last_error = None
            return True
        else:
            error_msg = response.text or 'Unknown error'
            logger.error(f"Brevo API error: {response.status_code} - {error_msg}")
            self.last_error = f"Brevo API error: {error_msg}"
            return False

    def _send_via_django(self, email, code):
        """
        Fallback to Django's send_mail (uses configured EMAIL_BACKEND)
        """
        subject = 'SOTI Delivery - Verification Code'
        message = f"""Hello,

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

        logger.info(f"Verification code sent via Django email to {email}")
        self.last_error = None
        return True

    def is_configured(self):
        """
        Check if Twilio is properly configured
        """
        # Always True as we rely solely on SMTP/email
        return True

# Create a singleton instance
sms_service = SMSService()

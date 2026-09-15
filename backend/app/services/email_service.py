import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import settings

def send_otp_email(to_email: str, otp: str):
    """
    Sends an OTP to the specified email address using SMTP.
    """
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        # Fallback to mock if not configured
        print("\n" + "="*40)
        print(f"MOCK EMAIL: OTP for {to_email} is {otp}")
        print("="*40 + "\n")
        return True
        
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your JOINLY Signup Verification Code"
        msg["From"] = settings.SMTP_EMAIL
        msg["To"] = to_email

        text = f"Your JOINLY verification code is: {otp}\n\nThis code will expire in 10 minutes."
        html = f"""\
        <html>
          <body>
            <h2>Welcome to JOINLY!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 2px;">{otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
          </body>
        </html>
        """

        part1 = MIMEText(text, "plain")
        part2 = MIMEText(html, "html")

        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False

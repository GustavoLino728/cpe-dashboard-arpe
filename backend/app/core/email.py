import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings


def send_email(to_email: str, subject: str, html_content: str) -> None:
    if not settings.smtp_host or not settings.smtp_user:
        print(f"⚠️ SMTP not configured. Email to {to_email} not sent. Subject: {subject}")
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to_email

    part = MIMEText(html_content, "html", "utf-8")
    msg.attach(part)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_tls:
                server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, to_email, msg.as_string())
        print(f"📧 Email sent successfully to {to_email}")
    except Exception as e:
        print(f"❌ Error sending email to {to_email}: {str(e)}")

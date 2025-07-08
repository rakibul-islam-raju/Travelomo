from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

from celery import shared_task


# send async email
@shared_task
def send_email(
    subject,
    plain_message,
    html_content,
    to_email,
):
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        to_email,
        html_message=html_content,
    )


def send_activation_email(user_email, activation_url):
    subject = "Activate Your Account"
    template_name = "mail/auth/activate_account.html"

    html_content = render_to_string(
        template_name=template_name, context={"activation_url": activation_url}
    )
    plain_message = strip_tags(html_content)

    send_email(
        subject=subject,
        plain_message=plain_message,
        html_content=html_content,
        to_email=[user_email],
    )


def send_password_reset_email(user_email, password_reset_url):
    subject = "Reset Your Password"
    template_name = "mail/auth/reset_password.html"

    html_content = render_to_string(
        template_name=template_name, context={"password_reset_url": password_reset_url}
    )
    plain_message = strip_tags(html_content)

    send_email(
        subject=subject,
        plain_message=plain_message,
        html_content=html_content,
        to_email=[user_email],
    )

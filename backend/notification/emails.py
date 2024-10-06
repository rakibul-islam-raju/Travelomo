import random
import string
import redis
from django.conf import settings
from django.core.mail import send_mail

from celery import shared_task

# Connect to Redis
redis_client = redis.StrictRedis(host="localhost", port=6379, db=0)


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
    plain_message = (
        f"Please activate your account by clicking the following link: {activation_url}"
    )
    html_content = f"<p>Please activate your account by clicking the following link: <a href='{activation_url}'>Activate Now</a></p>"

    send_email(
        subject=subject,
        plain_message=plain_message,
        html_content=html_content,
        to_email=[user_email],
    )

from django.template.loader import render_to_string
from django.utils.html import strip_tags

from notification.emails import send_email


def send_set_staff_password_email(user, set_password_url):
    subject = "Set Your Password"
    template_name = "mail/user/set_staff_password.html"

    html_content = render_to_string(
        template_name=template_name,
        context={"user": user, "set_password_url": set_password_url},
    )
    plain_message = strip_tags(html_content)

    send_email(
        subject=subject,
        plain_message=plain_message,
        html_content=html_content,
        to_email=[user.email],
    )


def send_user_deactivate_email(user, type):
    if type == "deactivate":
        subject = "Account Deactivation"
    else:
        subject = "Account Activation"

    template_name = "mail/user/user_deactivate.html"

    html_content = render_to_string(
        template_name=template_name, context={"user": user, "type": type}
    )
    plain_message = strip_tags(html_content)

    send_email(
        subject=subject,
        plain_message=plain_message,
        html_content=html_content,
        to_email=[user.email],
    )

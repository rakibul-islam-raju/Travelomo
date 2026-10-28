"""MAIL-002: retries, failure handling and monitoring for email delivery."""

import smtplib
from datetime import timedelta
from io import StringIO

from django.core import mail
from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from user.models import User

from ..delivery import is_transient_error, requeue_stale, resend, retry_delay
from ..models import EmailDelivery
from ..tasks import deliver_email
from .helpers import FLAKY_BACKEND, EagerCeleryMixin, FlakyEmailBackend


def make_delivery(**fields):
    defaults = {
        "kind": "test",
        "recipient": "customer@example.com",
        "subject": "Hello",
        "plain_body": "Hi there",
        "html_body": "<p>Hi there</p>",
    }
    return EmailDelivery.objects.create(**{**defaults, **fields})


@override_settings(EMAIL_BACKEND=FLAKY_BACKEND, EMAIL_DELIVERY_MAX_ATTEMPTS=3)
class DeliverEmailTests(EagerCeleryMixin, TestCase):
    def setUp(self):
        super().setUp()
        FlakyEmailBackend.failures = []

    def deliver(self, delivery):
        deliver_email.apply(args=[str(delivery.id)])
        delivery.refresh_from_db()
        return delivery

    def test_sends_html_and_plain_text_and_records_success(self):
        delivery = self.deliver(make_delivery())

        self.assertEqual(delivery.status, EmailDelivery.Status.SENT)
        self.assertEqual(delivery.attempts, 1)
        self.assertIsNotNone(delivery.sent_at)
        message = mail.outbox[0]
        self.assertEqual(message.body, "Hi there")
        self.assertEqual(message.alternatives[0][0], "<p>Hi there</p>")

    def test_temporary_failures_are_retried_until_sent(self):
        FlakyEmailBackend.failures = [
            smtplib.SMTPServerDisconnected("Connection unexpectedly closed"),
            ConnectionRefusedError("Connection refused"),
        ]

        with self.assertLogs("notification.tasks", "WARNING") as logs:
            delivery = self.deliver(make_delivery())

        self.assertEqual(delivery.status, EmailDelivery.Status.SENT)
        self.assertEqual(delivery.attempts, 3)
        self.assertEqual(delivery.last_error, "")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(len([r for r in logs.records if r.levelname == "WARNING"]), 2)

    def test_temporary_smtp_reply_is_retried(self):
        FlakyEmailBackend.failures = [smtplib.SMTPResponseException(451, b"Try again later")]

        with self.assertLogs("notification.tasks", "WARNING"):
            delivery = self.deliver(make_delivery())

        self.assertEqual(delivery.status, EmailDelivery.Status.SENT)
        self.assertEqual(delivery.attempts, 2)

    def test_gives_up_after_max_attempts_and_logs_an_error(self):
        FlakyEmailBackend.failures = [TimeoutError("timed out") for _ in range(5)]

        with self.assertLogs("notification.tasks", "WARNING") as logs:
            delivery = self.deliver(make_delivery())

        self.assertEqual(delivery.status, EmailDelivery.Status.FAILED)
        self.assertEqual(delivery.attempts, 3)
        self.assertEqual(len(FlakyEmailBackend.failures), 2)  # exactly 3 tries used
        self.assertIn("TimeoutError: timed out", delivery.last_error)
        self.assertIsNotNone(delivery.failed_at)
        self.assertEqual(mail.outbox, [])
        self.assertEqual(logs.records[-1].levelname, "ERROR")
        self.assertIn("failed permanently after 3 attempt(s)", logs.records[-1].getMessage())

    def test_permanent_rejection_is_not_retried(self):
        FlakyEmailBackend.failures = [
            smtplib.SMTPRecipientsRefused({"customer@example.com": (550, b"No such user")})
        ]

        with self.assertLogs("notification.tasks", "ERROR"):
            delivery = self.deliver(make_delivery())

        self.assertEqual(delivery.status, EmailDelivery.Status.FAILED)
        self.assertEqual(delivery.attempts, 1)

    def test_sent_email_is_never_sent_twice(self):
        delivery = self.deliver(make_delivery())

        result = deliver_email.apply(args=[str(delivery.id)]).get()

        self.assertIn("skipped", result)
        self.assertEqual(len(mail.outbox), 1)

    def test_email_claimed_by_another_worker_is_skipped(self):
        delivery = self.deliver(make_delivery(status=EmailDelivery.Status.SENDING, attempts=1))

        self.assertEqual(delivery.status, EmailDelivery.Status.SENDING)
        self.assertEqual(delivery.attempts, 1)
        self.assertEqual(mail.outbox, [])

    def test_missing_delivery_is_skipped(self):
        result = deliver_email.apply(args=["00000000-0000-0000-0000-000000000000"]).get()
        self.assertIn("skipped", result)


class FailureClassificationTests(TestCase):
    def test_transient_errors(self):
        for exc in [
            smtplib.SMTPServerDisconnected("closed"),
            smtplib.SMTPConnectError(421, b"Service not available"),
            smtplib.SMTPResponseException(451, b"Try later"),
            smtplib.SMTPRecipientsRefused({"a@example.com": (452, b"Mailbox full")}),
            ConnectionRefusedError(),
            TimeoutError(),
            OSError("Name or service not known"),
        ]:
            with self.subTest(exc=repr(exc)):
                self.assertTrue(is_transient_error(exc))

    def test_permanent_errors(self):
        for exc in [
            smtplib.SMTPAuthenticationError(535, b"Bad credentials"),
            smtplib.SMTPSenderRefused(550, b"Sender rejected", "noreply@example.com"),
            smtplib.SMTPRecipientsRefused({"a@example.com": (550, b"No such user")}),
            smtplib.SMTPNotSupportedError("STARTTLS not supported"),
            ValueError("bad header"),
        ]:
            with self.subTest(exc=repr(exc)):
                self.assertFalse(is_transient_error(exc))

    def test_retry_delay_backs_off_exponentially_with_a_cap(self):
        self.assertEqual([retry_delay(n) for n in range(1, 7)], [60, 120, 240, 480, 900, 900])


@override_settings(EMAIL_BACKEND=FLAKY_BACKEND)
class RecoveryTests(EagerCeleryMixin, TestCase):
    def setUp(self):
        super().setUp()
        FlakyEmailBackend.failures = []

    def age(self, delivery, minutes):
        EmailDelivery.objects.filter(pk=delivery.pk).update(
            updated_at=timezone.now() - timedelta(minutes=minutes)
        )

    def test_resend_gives_failed_email_a_fresh_budget(self):
        failed = make_delivery(status=EmailDelivery.Status.FAILED, attempts=6, last_error="Boom")
        make_delivery(status=EmailDelivery.Status.SENT, attempts=1)

        with self.captureOnCommitCallbacks(execute=True):
            count = resend(EmailDelivery.objects.all())

        self.assertEqual(count, 1)
        failed.refresh_from_db()
        self.assertEqual(failed.status, EmailDelivery.Status.SENT)
        self.assertEqual(failed.attempts, 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_lost_deliveries_are_requeued_and_recent_ones_left_alone(self):
        lost_pending = make_delivery()
        stuck_sending = make_delivery(status=EmailDelivery.Status.SENDING, attempts=1)
        recent_pending = make_delivery()
        self.age(lost_pending, 31)
        self.age(stuck_sending, 45)

        with self.assertLogs("notification.delivery", "WARNING"):
            with self.captureOnCommitCallbacks(execute=True):
                count = requeue_stale()

        self.assertEqual(count, 2)
        for delivery in [lost_pending, stuck_sending, recent_pending]:
            delivery.refresh_from_db()
        self.assertEqual(lost_pending.status, EmailDelivery.Status.SENT)
        self.assertEqual(stuck_sending.status, EmailDelivery.Status.SENT)
        self.assertEqual(stuck_sending.attempts, 2)  # the lost attempt still counts
        self.assertEqual(recent_pending.status, EmailDelivery.Status.PENDING)
        self.assertEqual(len(mail.outbox), 2)

    def test_admin_lists_deliveries_and_resends_failed_ones(self):
        admin = User.objects.create_superuser(
            email="admin@example.com", password=None, first_name="Admin", last_name="User"
        )
        self.client.force_login(admin)
        failed = make_delivery(status=EmailDelivery.Status.FAILED, attempts=6, last_error="SMTPAuthenticationError")
        url = reverse("admin:notification_emaildelivery_changelist")

        response = self.client.get(url, {"status__exact": "failed"})
        self.assertContains(response, "SMTPAuthenticationError")

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                url, {"action": "resend_failed", "_selected_action": [str(failed.pk)]}, follow=True
            )

        self.assertContains(response, "Queued 1 failed email(s) for resending.")
        failed.refresh_from_db()
        self.assertEqual(failed.status, EmailDelivery.Status.SENT)


class CheckEmailDeliveriesCommandTests(TestCase):
    def run_command(self, *args):
        out = StringIO()
        call_command("check_email_deliveries", *args, stdout=out)
        return out.getvalue()

    def test_healthy_when_everything_was_sent(self):
        make_delivery(status=EmailDelivery.Status.SENT, attempts=1)

        output = self.run_command()

        self.assertIn("sent: 1", output)
        self.assertIn("Email delivery is healthy.", output)

    def test_fails_when_an_email_failed(self):
        make_delivery(status=EmailDelivery.Status.FAILED, attempts=6, last_error="SMTPAuthenticationError: 535")

        with self.assertRaisesMessage(CommandError, "1 email delivery problem(s)"):
            self.run_command()

    def test_fails_when_an_email_is_stuck(self):
        stuck = make_delivery(status=EmailDelivery.Status.SENDING, attempts=1)
        EmailDelivery.objects.filter(pk=stuck.pk).update(
            updated_at=timezone.now() - timedelta(hours=1)
        )

        with self.assertRaises(CommandError):
            self.run_command()

    def test_old_failures_outside_the_window_are_ignored(self):
        old = make_delivery(status=EmailDelivery.Status.FAILED, attempts=6)
        EmailDelivery.objects.filter(pk=old.pk).update(
            created_at=timezone.now() - timedelta(days=3)
        )

        self.assertIn("healthy", self.run_command("--hours", "24"))

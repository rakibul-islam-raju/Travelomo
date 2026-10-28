from django.core.mail.backends import locmem

from core.eventcelery import app as celery_app


class EagerCeleryMixin:
    """
    Run `.delay()` calls inline; retries also run inline, ignoring countdowns.

    `task_eager_propagates` stays off: with it on, Celery raises the retry
    signal instead of running the retry.
    """

    def setUp(self):
        super().setUp()
        self.addCleanup(setattr, celery_app.conf, "task_always_eager", celery_app.conf.task_always_eager)
        celery_app.conf.task_always_eager = True


class FlakyEmailBackend(locmem.EmailBackend):
    """In-memory backend that raises the queued `failures` before succeeding."""

    failures: list = []

    def send_messages(self, messages):
        if FlakyEmailBackend.failures:
            raise FlakyEmailBackend.failures.pop(0)
        return super().send_messages(messages)


FLAKY_BACKEND = "notification.tests.helpers.FlakyEmailBackend"

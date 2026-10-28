import logging

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.serializers import as_serializer_error
from rest_framework.views import exception_handler, set_rollback

logger = logging.getLogger(__name__)


class BusinessRuleError(exceptions.APIException):
    """A well-formed request that a business rule does not allow (400, `detail` + `code`)."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "This request cannot be completed."
    default_code = "invalid_request"


class Conflict(exceptions.APIException):
    """A request that conflicts with the resource's current state (409, `detail` + `code`)."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "This request conflicts with the current state of the resource."
    default_code = "conflict"


def api_exception_handler(exc, context):
    """
    Return errors in the shapes defined in API_CONTRACT.md:

    - `{"detail": str, "code": str}` for general errors.
    - `{"<field>": [str, ...], "non_field_errors": [str, ...]}` for validation errors.
    """
    if isinstance(exc, DjangoValidationError):
        exc = exceptions.ValidationError(as_serializer_error(exc))

    response = exception_handler(exc, context)

    if response is None:
        if settings.DEBUG:
            # Let Django render its debug page during development.
            return None
        logger.exception("Unhandled API exception", exc_info=exc)
        set_rollback()
        return Response(
            {
                "detail": "Something went wrong. Please try again.",
                "code": "server_error",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if isinstance(exc, exceptions.ValidationError):
        data = as_serializer_error(exc)
        # `ValidationError({"detail": "..."})` is a general error; keep `detail` a string.
        if isinstance(data.get("detail"), list) and len(data["detail"]) == 1:
            data["detail"] = data["detail"][0]
        response.data = data
    elif isinstance(response.data, dict):
        detail = response.data.get("detail")
        code = getattr(detail, "code", None)
        if code and "code" not in response.data:
            response.data["code"] = code

    return response

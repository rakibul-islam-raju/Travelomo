from rest_framework.pagination import LimitOffsetPagination


class StandardLimitOffsetPagination(LimitOffsetPagination):
    """`limit`/`offset` pagination with the page-size cap defined in API_CONTRACT.md."""

    max_limit = 100

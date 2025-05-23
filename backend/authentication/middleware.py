from django.utils.functional import SimpleLazyObject
from django.contrib.auth.middleware import get_user
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTCookieMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_authentication = JWTAuthentication()

    def __call__(self, request):
        # First try to get the token from the cookie
        access = request.COOKIES.get("access")

        if access:
            try:
                # Validate the token and get the user
                validated_token = self.jwt_authentication.get_validated_token(access)
                request.user = self.jwt_authentication.get_user(validated_token)
            except (InvalidToken, TokenError):
                # If cookie auth fails, try header-based auth
                try:
                    auth_header = request.headers.get("Authorization")
                    if auth_header and auth_header.startswith("Bearer "):
                        token = auth_header.split(" ")[1]
                        validated_token = self.jwt_authentication.get_validated_token(
                            token
                        )
                        request.user = self.jwt_authentication.get_user(validated_token)
                    else:
                        request.user = SimpleLazyObject(lambda: get_user(request))
                except (InvalidToken, TokenError):
                    request.user = SimpleLazyObject(lambda: get_user(request))
        else:
            # If no cookie, try header-based auth
            try:
                auth_header = request.headers.get("Authorization")
                if auth_header and auth_header.startswith("Bearer "):
                    token = auth_header.split(" ")[1]
                    validated_token = self.jwt_authentication.get_validated_token(token)
                    request.user = self.jwt_authentication.get_user(validated_token)
                else:
                    request.user = SimpleLazyObject(lambda: get_user(request))
            except (InvalidToken, TokenError):
                request.user = SimpleLazyObject(lambda: get_user(request))

        response = self.get_response(request)
        return response

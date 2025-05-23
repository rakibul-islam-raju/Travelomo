from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # First try to get the token from the cookie
        access = request.COOKIES.get("access")

        if access:
            try:
                validated_token = self.get_validated_token(access)
                return self.get_user(validated_token), validated_token
            except (InvalidToken, TokenError):
                pass

        # If cookie authentication fails, try header-based authentication
        try:
            return super().authenticate(request)
        except (InvalidToken, TokenError):
            return None

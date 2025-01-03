from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

# from drf_spectacular.views import (
#     SpectacularAPIView,
#     SpectacularRedocView,
#     SpectacularSwaggerView,
# )

urlpatterns = [
    # # swagger
    # path(
    #     "",
    #     SpectacularSwaggerView.as_view(url_name="schema"),
    #     name="swagger-ui",
    # ),
    # # YOUR PATTERNS
    # path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    # admin
    path("admin/", admin.site.urls),
    # modules
    path("api/v1/auth/", include("authentication.urls", namespace="authentication")),
    path("api/v1/", include("vendor.urls", namespace="vendor")),
    path("api/v1/", include("user.urls", namespace="user")),
    path("api/v1/", include("event.urls", namespace="event")),
    path("api/v1/", include("stats.urls", namespace="stats")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

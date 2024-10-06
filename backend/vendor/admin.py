from django.contrib import admin
from django.contrib.admin.sites import AlreadyRegistered
from django.apps import apps

apps_models = apps.get_app_config("vendor").get_models()

for model in apps_models:
    try:
        admin.site.register(model)
    except AlreadyRegistered:
        pass

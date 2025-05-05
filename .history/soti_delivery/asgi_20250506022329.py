"""
ASGI config for soti_delivery project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from whitenoise import ASGIStaticFilesWrapper
import orders.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'soti_delivery.settings')

application = ProtocolTypeRouter({
    "http": ASGIStaticFilesWrapper(get_asgi_application()),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            orders.routing.websocket_urlpatterns
        )
    ),
})


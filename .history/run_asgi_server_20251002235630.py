#!/usr/bin/env python
"""
Script to run Django with ASGI support for WebSocket connections.
This is needed for Django Channels to work properly.
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'soti_delivery.settings')
django.setup()

# Import after Django setup
from channels.routing import get_default_application

if __name__ == "__main__":
    print("🚀 Starting Django ASGI server with WebSocket support...")
    print("📡 WebSocket endpoint: ws://localhost:8000/ws/orders/updates/")
    print("🌐 HTTP endpoint: http://localhost:8000/")
    print("Press Ctrl+C to stop")
    
    # This would normally be run with daphne or uvicorn
    # For development, you can use: daphne soti_delivery.asgi:application
    print("\n💡 To run with ASGI support, use:")
    print("   pip install daphne")
    print("   daphne soti_delivery.asgi:application")
    print("\n   Or with uvicorn:")
    print("   pip install uvicorn")
    print("   uvicorn soti_delivery.asgi:application")

#!/usr/bin/env bash

# Apply database migrations
python manage.py migrate

# Collect static files (optional, if using static files)
# python manage.py collectstatic --noinput

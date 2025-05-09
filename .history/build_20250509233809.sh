#!/usr/bin/env bash

# ✅ Step 1: Install dependencies
pip install -r requirements.txt

# ✅ Step 2: Apply migrations
python manage.py migrate

# ✅ Step 3: Collect static files (optional)
python manage.py collectstatic --noinput

import sys
import os

# Dodaj katalog aplikacji do sys.path
sys.path.insert(0, os.path.dirname(__file__))

from app import app as application  # <-- ważne: 'application' dla WSGI

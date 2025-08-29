import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from datetime import timedelta
load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SECRET_KEY =os.getenv("SECRET_KEY", "dev_secret_key")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle":280
    }
    PERMANENT_SESSION_LIFETIME = timedelta(minutes=30)
    # Added to solve refresh logout issue
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False # For local development (HTTP). Set to True in production (HTTPS).
    SESSION_COOKIE_SAMESITE = 'Lax'


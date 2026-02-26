import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

_db = None

def get_db():
    global _db
    if _db is not None:
        return _db

    FIREBASE_SERVICE_ACCOUNT = os.getenv("FIREBASE_SERVICE_ACCOUNT")
    if not FIREBASE_SERVICE_ACCOUNT:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT env var is not set")

    try:
        service_account_info = json.loads(FIREBASE_SERVICE_ACCOUNT)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"FIREBASE_SERVICE_ACCOUNT is not valid JSON: {e}")

    if not firebase_admin._apps:
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred)

    _db = firestore.client()
    return _db

# Lazy proxy — resolves on first access so the app boots even if env var missing
class _LazyDB:
    def __getattr__(self, name):
        return getattr(get_db(), name)

db = _LazyDB()

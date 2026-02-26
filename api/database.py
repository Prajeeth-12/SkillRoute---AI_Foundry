import json
import os

import firebase_admin
from firebase_admin import credentials, firestore

service_account_raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
if not service_account_raw:
    raise RuntimeError("FIREBASE_SERVICE_ACCOUNT is required")

service_account_info = json.loads(service_account_raw)
cred = credentials.Certificate(service_account_info)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

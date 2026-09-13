import firebase_admin
import json
from firebase_admin import credentials, firestore
from pathlib import Path
from ..core.config import BACKEND_DIR, settings

# Initialize Firebase Admin
try:
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        service_account_info = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        cred = credentials.Certificate(service_account_info)
        firebase_admin.initialize_app(cred)
    elif settings.FIREBASE_CREDENTIALS_PATH:
        credential_path = Path(settings.FIREBASE_CREDENTIALS_PATH)
        if not credential_path.is_absolute():
            credential_path = BACKEND_DIR / credential_path
        cred = credentials.Certificate(credential_path)
        firebase_admin.initialize_app(cred)
    else:
        # If no credentials, we try default (works in GCP or if GOOGLE_APPLICATION_CREDENTIALS is set)
        firebase_admin.initialize_app()
    
    db = firestore.client()
    print("Firebase Admin initialized successfully.")
except Exception as e:
    print(f"Warning: Firebase Admin initialization failed. {e}")
    # Will fail subsequent calls but allows API to start
    db = None
    bucket = None

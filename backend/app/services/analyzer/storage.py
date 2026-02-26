"""
Firestore persistence for gap-analysis results.

Stores results under:  users/{userId}/gap_analyses/{auto-id}

This is the ONLY Firestore write in the analyzer package.
No Firebase Storage is used – all file data was processed in RAM.
"""

from datetime import datetime
from app.utils.firebase import db


def save_gap_analysis(user_id: str, payload: dict) -> str:
    """
    Persists a gap-analysis result to Firestore and returns the new document ID.

    Called as a FastAPI BackgroundTask so it never blocks the HTTP response.
    """
    doc_ref = (
        db.collection("users")
          .document(user_id)
          .collection("gap_analyses")
          .document()          # Auto-generate ID
    )

    data = {
        **payload,
        "analyzed_at": datetime.utcnow(),
    }

    # Flatten nested dicts so Firestore serialises cleanly
    # (learning_velocity.roadmap is already a list of plain dicts – safe to store)
    doc_ref.set(data)

    return doc_ref.id

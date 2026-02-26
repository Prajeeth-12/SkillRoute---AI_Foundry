from firebase_admin import auth
from fastapi import Header, HTTPException
from app.utils.firebase import init_firebase_app


def verify_firebase_token(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")

    token = authorization.split(" ")[1]

    try:
        init_firebase_app()  # ensure Firebase is initialized before verifying
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

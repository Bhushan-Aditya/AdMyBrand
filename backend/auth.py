# auth.py (or directly in likes.py/matches.py if preferred)
from fastapi import Depends, HTTPException, status, Header # Import Header
from typing import Optional

# --- NEW Insecure Dependency ---
async def get_user_id_from_header(x_user_id: Optional[str] = Header(None, description="INSECURE - User ID sent directly from frontend for development")) -> int:
    """
    INSECURE DEVELOPMENT ONLY: Gets user ID from the X-User-ID header.
    Raises 401 if the header is missing or not a valid integer.
    Replace with real token validation for production!
    """
    print(f"⚠️ WARNING: Retrieving user ID directly from header: {x_user_id}. Insecure for production!")
    if x_user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-User-ID header (Required for insecure dev auth)",
        )
    try:
        user_id = int(x_user_id)
        # Optional: You COULD quickly check if user exists in DB here for basic validation
        # db = next(get_db()) # This syntax is tricky outside route context
        # if not db.get(User, user_id): raise HTTPException(...) 
        return user_id
    except (ValueError, TypeError):
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-User-ID header format (must be an integer)",
        )

# Remove or comment out the get_placeholder_current_user_id function
# async def get_placeholder_current_user_id() -> int: ...
# users.py

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

# Project imports
from models import User
from schemas import UserSignUp, UserOut, UserProfileUpdate, Token, GenderEnum  # Added missing schemas needed below
from database import get_db

# --- CORRECT: Import auth functions that ARE defined in auth.py ---
# Assuming your auth.py NOW ONLY defines get_user_id_from_header for dev
# (We removed verify_password, get_password_hash, create_access_token etc. when switching to insecure header method)
from auth import get_user_id_from_header  # Assuming this is what auth.py contains now

# --- NEED THESE HELPERS (Define them here OR move back to auth.py) ---
# We still need password hashing for signup and verification for login!
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hashes a plain password."""
    return pwd_context.hash(password)


# --- End Required Helpers ---


# --- (Keep for future REAL authentication, needs JWT related imports too) ---
# from jose import jwt # Needs python-jose
# from auth import (
#      create_access_token,
#      ACCESS_TOKEN_EXPIRE_MINUTES,
# )
# --- End JWT Placeholder ---


router = APIRouter()


# --- Signup Endpoint ---
@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED, summary="Register New User")
def signup(user: UserSignUp, db: Session = Depends(get_db)):
    """
    Registers a new user with email and password.
    Checks for existing email. Hashes password before saving.
    """
    stmt_exists = select(User).where(User.email == user.email)
    exists = db.scalar(stmt_exists)
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Use the hashing function defined above
    hashed_password = get_password_hash(user.password)
    print(f"--- [Signup] Hashed password for {user.email} ---")

    db_user = User(
        email=user.email,
        password_hash=hashed_password,
    )
    db.add(db_user)
    try:
        db.commit()
        print(f"--- [Signup] User committed with tentative ID {db_user.user_id} ---")
        db.refresh(db_user)
        print(f"--- [Signup] User {db_user.user_id} REFRESHED. ---")
    except Exception as e:
        db.rollback()
        print(f"!!! Error during user signup commit/refresh: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Database error creating account.")

    try:
        # Ensure validation works
        return UserOut.model_validate(db_user)
    except Exception as validation_error:
        print(f"!!! Error validating UserOut after signup for {db_user.user_id}: {validation_error}")
        raise HTTPException(status_code=500, detail="Error formatting user data response after creation.")


# --- Login Endpoint (REMOVED - As login functionality isn't implemented yet) ---
# If you KEEP the login page frontend, you'll need a simplified login later maybe
# that just sets the userId in localStorage without token exchange for dev?
# For now, removing the '/token' endpoint as its helpers (create_access_token) are missing from the provided auth.py
# @router.post("/token", ...)
# def login_for_access_token(...): ...


# --- Profile Update Endpoint ---
# Currently uses Path parameter user_id, doesn't enforce authorization
@router.put("/profile/{user_id}", response_model=UserOut, summary="Update User Profile")
def update_profile(
        user_id: int,  # Get ID from path
        profile: UserProfileUpdate,
        db: Session = Depends(get_db),
        # NOTE: Still using path parameter `user_id`. No auth check applied yet.
):
    """
    Updates profile information for the user ID specified in the path.
    WARNING: Currently insecure, does not verify logged-in user.
    """
    print(f"--- [Update Profile] Attempting update for user {user_id} (via path param) ---")

    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = profile.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    print(f"--- [Update Profile] Updating user {user_id} with data: {update_data} ---")
    for key, value in update_data.items():
        # If the incoming value is an Enum, store its .value (string)
        if isinstance(value, GenderEnum):
            setattr(db_user, key, value.value)
        else:
            setattr(db_user, key, value)

    try:
        db.commit()
        db.refresh(db_user)
        print(f"--- [Update Profile] User {user_id} updated successfully. ---")
    except Exception as e:
        db.rollback()
        print(f"!!! Error updating profile for user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save profile changes.")

    try:
        return UserOut.model_validate(db_user)
    except Exception as validation_error:
        print(f"!!! Error validating UserOut after profile update for {user_id}: {validation_error}")
        raise HTTPException(status_code=500, detail="Error formatting user data response after update.")


# --- Get User Details Endpoint ---
# This is called by MatchPage initially
@router.get("/{user_id}", response_model=UserOut, summary="Get User by ID")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieves public details for a specific user by their ID.
    """
    print(f"--- [GET /users/{user_id}] Attempting to fetch user ---")

    # Define relationships to eager load for MatchPage display
    load_options = [
        selectinload(User.interests),
        selectinload(User.photos)
    ]

    stmt = select(User).options(*load_options).where(User.user_id == user_id)

    db_user = db.scalar(stmt)

    if db_user is None:
        print(f"--- [GET /users/{user_id}] User ID {user_id} NOT FOUND ---")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with id {user_id} not found")

    print(f"--- [GET /users/{user_id}] User ID {user_id} FOUND. Validating & Returning. ---")

    try:
        return UserOut.model_validate(db_user)
    except Exception as val_err:
        print(f"!!! Error validating UserOut for GET /users/{user_id}: {val_err}")
        raise HTTPException(status_code=500, detail="Error formatting user data for response")
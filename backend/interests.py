# interests.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload  # Added selectinload
from sqlalchemy import select  # Use sqlalchemy.select
from typing import List

# Project specific imports
from database import get_db  # Import the SYNC dependency
from models import User, Interest  # Import User and Interest models
from schemas import InterestOut, UserInterestsUpdate, UserOut  # Import necessary schemas

router = APIRouter()


# --- Endpoint to Get All Available Interests ---
# This can remain synchronous as it uses the sync get_db
@router.get("/available", response_model=List[InterestOut], summary="Get All Available Interests")
def get_available_interests(db: Session = Depends(get_db)):  # REMOVED async/await
    """
    Retrieve a list of all predefined interests available for selection.
    Useful for populating the frontend UI.
    """
    # Use the select construct
    stmt = select(Interest).order_by(Interest.category, Interest.name)
    interests = db.scalars(stmt).all()  # Use db.scalars(...).all() with sync session
    return interests


# --- Endpoint to Update a Specific User's Interests ---
# Note: Using PUT implies replacing the entire list of interests
# REMOVED async/await here
@router.put(
    "/users/{user_id}",
    response_model=UserOut,
    summary="Update/Set User's Interests"
)
def update_user_interests(
        user_id: int,
        interests_update: UserInterestsUpdate,
        db: Session = Depends(get_db)
):
    """
    Set or replace the interests for a specific user.
    Expects a list of interest *names* (strings) in the request body.
    """
    # 1. Get the user
    # Use options for eager loading interests on the user for the final response
    stmt_user = select(User).where(User.user_id == user_id).options(selectinload(User.interests))
    db_user = db.scalar(stmt_user)  # db.scalar with sync session

    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # 2. Find the corresponding Interest objects in the DB based on the names provided
    if not interests_update.interests:
        # If an empty list is provided, clear the user's interests
        print(f"Clearing interests for user {user_id}")
        db_user.interests.clear()  # This works directly with the relationship
        valid_interests = []  # Ensure valid_interests is defined even if cleared
    else:
        # Fetch Interest objects matching the provided names
        interest_names = interests_update.interests
        stmt_interests = select(Interest).where(Interest.name.in_(interest_names))
        valid_interests = db.scalars(stmt_interests).all()  # Use db.scalars(...).all()

        # Optional: Check if all provided interest names were found
        found_names = {interest.name for interest in valid_interests}
        missing_interests = set(interest_names) - found_names
        if missing_interests:
            # Decide how to handle: Ignore? Raise error? Log?
            print(f"Warning: Interests not found in DB and skipped for user {user_id}: {missing_interests}")
            # Example: If you want to reject requests with invalid interests:
            # raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Interests not found: {', '.join(missing_interests)}")

        # 3. Update the user's interests relationship
        # SQLAlchemy handles the association table inserts/deletes automatically here by replacing the list
        print(f"Setting interests for user {user_id} to: {[i.name for i in valid_interests]}")
        db_user.interests = valid_interests

        # 4. Commit and Refresh (No await)
    try:
        db.commit()
        db.refresh(db_user)  # Refresh to load the relationships correctly for the response
        # Manually ensure interests are loaded if not using eager loading or refresh doesn't load them reliably
        # For UserOut schema which needs the list, ensure they are accessible:
        print(f"User {user_id} interests after refresh: {[i.name for i in db_user.interests]}")

    except Exception as e:
        db.rollback()  # Rollback in case of error during commit
        print(f"Error committing user interests: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to save interests.")

    # Return the updated user, including their interests (now populated)
    return db_user


# --- Optional: Endpoint to Get a Specific User's Interests ---
# REMOVED async/await
@router.get(
    "/users/{user_id}",
    response_model=List[InterestOut],
    summary="Get User's Interests"
)
def get_user_interests(user_id: int, db: Session = Depends(get_db)):
    """
    Retrieve the list of interests for a specific user.
    """
    # Use options for eager loading interests
    stmt = select(User).where(User.user_id == user_id).options(selectinload(User.interests))
    db_user = db.scalar(stmt)

    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # The interests are loaded via the relationship and eager loading
    return db_user.interests
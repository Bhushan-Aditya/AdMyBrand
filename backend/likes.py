# likes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, insert, literal
from typing import Optional

# Project imports
from database import get_db
from models import User, Like, Match
from schemas import LikeCreate, LikeResponse, UserOut
# --- Import the NEW insecure dependency from auth.py ---
from auth import get_user_id_from_header  # Adjust import path if auth.py is elsewhere

router = APIRouter()


@router.post(
    "",
    response_model=LikeResponse,
    status_code=status.HTTP_200_OK,
    summary="Record a Like and Check for Match"
)
def create_like(  # Sync function, DB calls are blocking
        like_data: LikeCreate,
        db: Session = Depends(get_db),
        # --- Use the header dependency to get the 'liker_id' ---
        current_user_id: int = Depends(get_user_id_from_header)
):
    """
    Records a 'like' from the user identified by X-User-ID header
    to another user (liked_user_id). Checks for mutual match.
    WARNING: Insecure for production.
    """
    liker_id = current_user_id
    liked_id = like_data.liked_user_id

    # 1. Basic validation
    if liker_id == liked_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Users cannot like themselves.")

    # 2. Check if the target user exists
    # Use eager loading if 'matched_user' in response needs photos/interests
    stmt_liked = select(User).options(
        selectinload(User.photos),
        selectinload(User.interests)
    ).where(User.user_id == liked_id)
    liked_user = db.scalar(stmt_liked)
    if not liked_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User to be liked not found.")

    # 3. Check if this 'like' already exists
    stmt_existing_like = select(Like).where(Like.liker_id == liker_id, Like.liked_id == liked_id)
    existing_like = db.scalar(stmt_existing_like)

    if existing_like:
        print(f"Like already exists from {liker_id} to {liked_id}.")
    else:
        # Create the new 'like' record
        db_like = Like(liker_id=liker_id, liked_id=liked_id)  # liked_at handled by DB default
        db.add(db_like)
        print(f"Recorded like from {liker_id} to {liked_id}")

    # 4. Check if the liked user has already liked the current user back
    stmt_mutual_like = select(literal(True)).where(Like.liker_id == liked_id, Like.liked_id == liker_id).limit(1)
    is_mutual_like = db.scalar(stmt_mutual_like) is True

    match_status = "liked"
    matched_user_details_response: Optional[UserOut] = None

    if is_mutual_like:
        match_status = "matched"
        print(f"Mutual match detected between {liker_id} and {liked_id}!")

        # Ensure consistent order for match pair
        user_1_id = min(liker_id, liked_id)
        user_2_id = max(liker_id, liked_id)

        stmt_existing_match = select(Match).where(Match.user_1_id == user_1_id, Match.user_2_id == user_2_id)
        existing_match = db.scalar(stmt_existing_match)

        if not existing_match:
            db_match = Match(user_1_id=user_1_id, user_2_id=user_2_id)  # matched_at handled by DB default
            db.add(db_match)
            print(f"Created match record for {user_1_id} and {user_2_id}")
            # TODO: Trigger notifications
        else:
            print(f"Match record already exists for {user_1_id} and {user_2_id}")

        # Prepare liked user's data for response
        try:
            matched_user_details_response = UserOut.model_validate(liked_user)
        except Exception as e:
            print(f"Error validating liked_user for response: {e}")
            matched_user_details_response = None

    # 5. Commit the transaction
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Database error during commit for like/match: {e}")
        # Could be unique constraint violation if requests overlap - needs handling if necessary
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save like/match information."
        )

    # 6. Return the status
    return LikeResponse(
        match_status=match_status,
        matched_user=matched_user_details_response
    )
# matches.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload, contains_eager  # Need contains_eager
from sqlalchemy import select, case, or_, func, desc  # Need func, desc
from typing import List, Set, Optional, Dict  # Need Dict
from collections import Counter  # Need Counter for tallying

# Project imports
from database import get_db
# Import relevant models including the association table object directly
from models import User, Like, Match, ProfilePhoto, Interest, user_interests_association
from schemas import UserOut
from auth import get_user_id_from_header  # Use insecure header method for now

router = APIRouter()


@router.get("/potential_by_interest", response_model=List[UserOut], summary="Get Profiles by Shared Interests")
def get_potential_matches_by_interest(
        db: Session = Depends(get_db),
        limit: int = 20,  # Fetch more initially as ranking handles display order
        current_user_id: int = Depends(get_user_id_from_header)
):
    """
    Fetches potential profiles for the match screen, prioritizing users
    with the most shared interests. Excludes self, liked, and matched users.
    """
    print(f"Fetching interest-based matches for user {current_user_id}")

    # 1. Get the Current User's Interests (Names or IDs)
    stmt_my_interests = select(Interest.interest_id).join(
        user_interests_association
    ).where(user_interests_association.c.user_id == current_user_id)
    my_interest_ids = set(db.scalars(stmt_my_interests).all())

    if not my_interest_ids:
        # Handle case where current user has no interests set - maybe return random users?
        print(f"User {current_user_id} has no interests set. Returning general users.")
        # Fallback to fetching users excluding self/liked/matched without interest ranking
        # (Adapt the previous potential match logic here without interest part)
        # For now, just return empty to signify need for interests
        return []

    print(f"User {current_user_id} interest IDs: {my_interest_ids}")

    # 2. Find Excluded User IDs (Self, Liked, Matched) - Keep this logic
    stmt_liked = select(Like.liked_id).where(Like.liker_id == current_user_id)
    liked_user_ids = db.scalars(stmt_liked).all()

    stmt_matched = select(
        case((Match.user_1_id == current_user_id, Match.user_2_id), else_=Match.user_1_id)
    ).where(or_(Match.user_1_id == current_user_id, Match.user_2_id == current_user_id))
    matched_user_ids = db.scalars(stmt_matched).all()

    excluded_ids: Set[int] = set(liked_user_ids) | set(matched_user_ids) | {current_user_id}
    print(f"Excluding user IDs: {excluded_ids}")

    # 3. Find Users Who Share Interests (Efficiently)
    # Query the association table to find users who have ANY of the current user's interests
    stmt_sharers = (
        select(
            user_interests_association.c.user_id,
            func.count(user_interests_association.c.interest_id).label('shared_interest_count')
        )
        .where(
            user_interests_association.c.interest_id.in_(my_interest_ids),  # Shares at least one interest
            user_interests_association.c.user_id.notin_(excluded_ids)  # Not excluded
        )
        .group_by(user_interests_association.c.user_id)  # Count shared interests per user
        .order_by(desc('shared_interest_count'))  # Order by most shared interests
        .limit(limit * 2)  # Fetch more candidates than limit, as some might fail validation etc.
    )

    # Fetch results: (user_id, count) pairs
    results = db.execute(stmt_sharers).all()

    potential_user_ids_ranked = [row[0] for row in results]  # Get just the user IDs in ranked order
    if not potential_user_ids_ranked:
        print("No users found sharing interests.")
        return []  # Or fetch random non-excluded users as fallback

    print(f"Found {len(potential_user_ids_ranked)} potential users sharing interests (ranked).")

    # 4. Fetch Full User Details for the Ranked IDs
    # We need to preserve the ranking order from the previous query
    stmt_fetch_details = (
        select(User)
        .options(
            selectinload(User.photos),
            selectinload(User.interests)  # Load their interests too for display
        )
        .where(User.user_id.in_(potential_user_ids_ranked))
        # ORDER BY FIELD is tricky across DBs, map results back to ranked order instead
    )

    users_found = db.scalars(stmt_fetch_details).unique().all()

    # Map fetched users into a dictionary for easy lookup by ID
    users_dict: Dict[int, User] = {user.user_id: user for user in users_found}

    # Reconstruct the list in the original ranked order
    ranked_user_objects = [users_dict[uid] for uid in potential_user_ids_ranked if uid in users_dict]

    print(f"Fetched details for {len(ranked_user_objects)} ranked users.")

    # 5. Validate and Prepare final list using UserOut schema
    validated_profiles: List[UserOut] = []
    for user in ranked_user_objects:
        try:
            validated_profiles.append(UserOut.model_validate(user))
        except Exception as e:
            print(f"Warning: Skipping user {user.user_id} due to validation error: {e}")

    # Add dummy profiles if desired (keep that logic if needed)
    # ... validated_profiles.extend(dummy_users_validated) ...

    # 6. Return the final list (respecting original limit)
    print(f"Returning final list of {len(validated_profiles[:limit])} profiles.")
    return validated_profiles[:limit]
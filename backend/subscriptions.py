# subscriptions.py
import os
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload  # Import selectinload
from sqlalchemy import select, update

from database import get_db
from models import User, Subscription
# Import UserOut as well now
from schemas import (
    SubscriptionUpdate, PlanTypeEnum, SubscriptionStatusEnum, SubscriptionOut, UserOut
)

router = APIRouter()

# --- Subscription Durations (Aligned with DB/Schemas) ---
SUBSCRIPTION_DURATIONS = {
    PlanTypeEnum.premium: timedelta(days=30),
    PlanTypeEnum.platinum: timedelta(days=90),  # Example
    # No entry for 'basic' implies logic below handles it
}


@router.put(
    "/users/{user_id}/upgrade",
    # *** CHANGE response_model to UserOut ***
    response_model=UserOut,
    summary="Set or Update User Subscription"
)
def set_or_update_subscription(
        user_id: int,
        subscription_data: SubscriptionUpdate,
        db: Session = Depends(get_db)
):
    """
    Updates/Creates subscription record in the 'subscriptions' table.
    Returns the FULL updated User object.
    """
    # --- Use options to eager load subscriptions when getting the user ---
    stmt_get_user = (
        select(User)
        .options(selectinload(User.subscriptions))  # Eager load subscriptions
        .where(User.user_id == user_id)
    )
    db_user = db.scalar(stmt_get_user)

    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_plan = subscription_data.plan
    today_date = datetime.now(timezone.utc).date()

    # --- Find the latest subscription (reuse existing logic) ---
    # Find latest overall subscription to decide whether to update or create
    latest_sub = None
    if db_user.subscriptions:  # Check if the eager loaded list has items
        latest_sub = db_user.subscriptions[0]  # relies on order_by in User model's relationship

    # --- Calculate End Date ---
    duration = SUBSCRIPTION_DURATIONS.get(new_plan)
    if duration:
        end_date_calculated = today_date + duration
    elif new_plan == PlanTypeEnum.basic:
        # Example: basic is treated as effectively non-expiring for logic
        end_date_calculated = today_date + timedelta(days=365 * 100)  # Far future
        print(f"Assigning far-future end date for plan '{new_plan.value}'")
    else:
        print(f"Error: Subscription duration not defined for plan '{new_plan.value}'.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Internal configuration error: Subscription duration missing.")

    try:
        db_sub_to_refresh = None  # Keep track of the sub object we modified/added
        if latest_sub:
            # Update the most recent record
            print(
                f"Updating latest subscription {latest_sub.subscription_id} for user {user_id} to plan {new_plan.value}")
            latest_sub.plan_type = new_plan
            latest_sub.status = SubscriptionStatusEnum.active
            latest_sub.start_date = today_date
            latest_sub.end_date = end_date_calculated
            db_sub_to_refresh = latest_sub
        else:
            # Create new record if user had no previous subscriptions
            print(f"Creating new subscription record for user {user_id} with plan {new_plan.value}")
            new_sub = Subscription(
                user_id=user_id,
                plan_type=new_plan,
                start_date=today_date,
                end_date=end_date_calculated,
                status=SubscriptionStatusEnum.active
            )
            db.add(new_sub)
            db_sub_to_refresh = new_sub

        db.commit()
        # Refresh the specific subscription AND the user object to reload relationships
        if db_sub_to_refresh:  # Need to refresh the sub first if it's new to get ID
            db.refresh(db_sub_to_refresh)
        db.refresh(db_user)  # Refresh user to get updated relationship list

    except Exception as e:
        db.rollback()
        print(f"Error updating/creating subscription for user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Could not process subscription update.")

    # *** Return the UPDATED USER OBJECT ***
    return db_user

# Optional: get_active_subscription endpoint (keep as is or remove if not used)
# ... get_active_subscription function ...
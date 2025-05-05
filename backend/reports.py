# reports.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

# Project imports
from database import get_db
from models import User, Report  # Import relevant models
from schemas import ReportCreate, ReportOut  # Import relevant schemas
from auth import get_user_id_from_header  # Use insecure header method for now

router = APIRouter()


@router.post(
    "",
    response_model=ReportOut,  # Return the created report details
    status_code=status.HTTP_201_CREATED,
    summary="Submit a User Report"
)
def create_report(
        report_data: ReportCreate,
        db: Session = Depends(get_db),
        current_user_id: int = Depends(get_user_id_from_header)  # Get reporter's ID
):
    """
    Allows an authenticated user (identified by header) to report another user.
    Requires the `reported_user_id` and a `reason` in the request body.
    WARNING: Uses insecure header authentication for development.
    """
    reporter_id = current_user_id
    reported_user_id = report_data.reported_user_id

    # 1. Validation
    if reporter_id == reported_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Users cannot report themselves."
        )

    # Check if reported user exists
    reported_user = db.get(User, reported_user_id)
    if not reported_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User to be reported (ID: {reported_user_id}) not found."
        )

    # Optional: Add checks to prevent spamming reports (e.g., rate limiting,
    # or check if reporter recently reported the same user for the same reason)

    # 2. Create Report object
    db_report = Report(
        reporter_id=reporter_id,
        reported_user_id=reported_user_id,
        reason=report_data.reason
        # status and created_at use model defaults
    )

    # 3. Add to DB and commit
    db.add(db_report)
    try:
        db.commit()
        db.refresh(db_report)  # Get generated ID, timestamp, status
        print(f"Report {db_report.report_id} created by user {reporter_id} against user {reported_user_id}")
    except Exception as e:
        db.rollback()
        print(f"!!! Database error creating report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the report due to a database error."
        )

    # 4. Return the created report object
    try:
        return ReportOut.model_validate(db_report)
    except Exception as val_err:
        print(f"!!! Error validating ReportOut after creation: {val_err}")
        # Even if validation fails, report was likely saved. Log and maybe return simple success?
        # Returning 500 helps identify schema/model mismatch
        raise HTTPException(status_code=500, detail="Report saved, but error formatting response.")

# TODO (Future/Admin): Add endpoints like GET /reports, PUT /reports/{report_id}/status etc.
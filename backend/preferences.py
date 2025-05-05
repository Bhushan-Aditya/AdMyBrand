from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Preference, User
from schemas import PreferenceCreate

router = APIRouter()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Route to set or update user preferences
@router.post("/set-preferences")
def set_preferences(preference: PreferenceCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == preference.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if preferences already exist
    existing_pref = db.query(Preference).filter(Preference.user_id == preference.user_id).first()

    if existing_pref:
        # Update existing preferences
        existing_pref.preferred_gender = preference.preferred_gender
        existing_pref.age_min = preference.age_min
        existing_pref.age_max = preference.age_max
        existing_pref.location_radius_km = preference.location_radius_km
    else:
        # Create new preference
        new_pref = Preference(
            user_id=preference.user_id,
            preferred_gender=preference.preferred_gender,
            age_min=preference.age_min,
            age_max=preference.age_max,
            location_radius_km=preference.location_radius_km
        )
        db.add(new_pref)

    db.commit()
    return {"message": "Preferences saved successfully"}

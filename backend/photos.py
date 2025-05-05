# photos.py
import os
import uuid
import shutil
from datetime import datetime  # Make sure datetime is imported
from pathlib import Path
from typing import List, Optional  # Added Optional

from fastapi import (
    APIRouter, Depends, HTTPException, status, UploadFile, File, Form  # Added Form
)
from sqlalchemy.orm import Session
from sqlalchemy import select, update

# Project specific imports
from database import get_db
from models import User, ProfilePhoto
# Import necessary schemas (ProfilePhotoOut, maybe others if needed)
# Make sure ProfilePhotoOut exists in your schemas.py
from schemas import ProfilePhotoOut

router = APIRouter()

# --- Configuration ---
UPLOAD_DIRECTORY = Path("./static/user_photos")
# Adjust base path for serving, must align with StaticFiles mount in main.py
# Assuming main.py mounts './static' at '/static'
SERVE_PATH_BASE = "/static/user_photos"
MAX_PHOTOS_PER_USER = 6
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

UPLOAD_DIRECTORY.mkdir(parents=True, exist_ok=True)


def allowed_file(filename: str):
    return '.' in filename and \
        filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# --- Schemas (Alternatively, put these in schemas.py) ---
# Defining them here for completeness if not already in schemas.py
# class ProfilePhotoBase(BaseModel):
#     photo_url: str
#     is_primary: bool
#
# class ProfilePhotoOut(ProfilePhotoBase):
#     photo_id: int
#     uploaded_at: Optional[datetime] = None
#
#     model_config = {
#         "from_attributes": True,
#     }
# --- End Schemas ---


# --- Helper function to save file ---
def save_upload_file(upload_file: UploadFile, destination: Path) -> None:
    """Saves an uploaded file to the specified destination."""
    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()


# --- Endpoint to Upload Photos for a User (Relative Path) ---
@router.post(
    "/users/{user_id}",  # <<< PATH CHANGED: Relative to '/photos' prefix in main.py
    response_model=List[ProfilePhotoOut],
    status_code=status.HTTP_201_CREATED,
    summary="Upload Profile Photos for a User"
)
def upload_photos_for_user(
        user_id: int,
        # Use Form() for primary_photo_index when sending files via multipart/form-data
        primary_photo_index: Optional[int] = Form(None, description="0-based index of primary photo in files list"),
        files: List[UploadFile] = File(..., description=f"Up to {MAX_PHOTOS_PER_USER} image files"),
        db: Session = Depends(get_db)
):
    """
    Uploads one or more photos for the specified user.
    Accessed via POST /photos/users/{user_id} (due to router prefix).
    - Saves files locally.
    - Creates database records.
    - Handles setting primary photo based on primary_photo_index Form field.
    """
    # 1. Verify User Exists
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # 2. Check photo count limit
    stmt_count = select(ProfilePhoto).where(ProfilePhoto.user_id == user_id)
    current_photo_count = len(db.scalars(stmt_count).all())  # Simple count
    if current_photo_count + len(files) > MAX_PHOTOS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot upload {len(files)} photos. Maximum total is {MAX_PHOTOS_PER_USER}, already have {current_photo_count}."
        )

    # --- Determine which photo index is primary ---
    # Default to 0 if not provided or invalid, ONLY if uploading new photos
    actual_primary_index = 0
    if primary_photo_index is not None and 0 <= primary_photo_index < len(files):
        actual_primary_index = primary_photo_index
    elif current_photo_count > 0:
        # If user already has photos, don't default primary for new uploads unless specified
        # Keep existing primary unless explicitly overridden
        # Logic below will unmark existing primaries anyway
        actual_primary_index = -1  # Flag that no NEW photo is explicitly primary

    # --- Unset existing primary photos for this user (if a new primary is designated) ---
    # Only run this if the frontend designated one of the NEW uploads as primary
    if actual_primary_index != -1:
        stmt_unmark_primary = (
            update(ProfilePhoto)
            .where(ProfilePhoto.user_id == user_id)
            .where(ProfilePhoto.is_primary == True)
            .values(is_primary=False)
        )
        db.execute(stmt_unmark_primary)
        print(f"Unmarked existing primary photos for user {user_id}")

    # --- Process and Save Files ---
    created_photos_db = []
    saved_file_paths = []
    user_photo_dir = UPLOAD_DIRECTORY / str(user_id)
    user_photo_dir.mkdir(exist_ok=True)  # Ensure user's directory exists

    for index, file in enumerate(files):
        if not file.filename or not allowed_file(file.filename):
            print(f"Warning: Skipped invalid file type: {file.filename}")
            continue  # Skip this file, process the next one

        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path_on_disk = user_photo_dir / unique_filename
        # Path to be stored in DB and used for URL generation
        relative_serve_path = f"{SERVE_PATH_BASE}/{user_id}/{unique_filename}"

        try:
            save_upload_file(file, file_path_on_disk)
            saved_file_paths.append(file_path_on_disk)  # Keep track for cleanup on error
        except Exception as e:
            print(f"Error saving file {file.filename}: {e}")
            # Attempt to clean up already saved files from this batch on error
            for fp in saved_file_paths:
                if fp.exists(): fp.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Could not save image file: {file.filename}.",
            )

        # Determine if this specific photo should be primary
        # Needs to handle the case where the user HAD photos but specified no new primary (actual_primary_index = -1)
        # AND the case where this IS the first photo ever for the user
        is_current_photo_primary = False
        if actual_primary_index == index:  # Was this new upload designated primary?
            is_current_photo_primary = True
        elif actual_primary_index == -1 and current_photo_count == 0 and index == 0:  # Is it the very first photo overall for the user?
            is_current_photo_primary = True

        # Create DB record
        db_photo = ProfilePhoto(
            user_id=user_id,
            photo_url=relative_serve_path,
            is_primary=is_current_photo_primary
        )
        db.add(db_photo)
        created_photos_db.append(db_photo)

    # --- Commit to Database ---
    if not created_photos_db:  # Check if any valid photos were processed
        if files:  # User tried to upload only invalid files
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"No valid image files uploaded. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
        else:  # Should not happen if File(...) is used, but as safety check
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No files were uploaded.")

    try:
        db.commit()
        for photo in created_photos_db:
            db.refresh(photo)
    except Exception as e:
        db.rollback()
        # Clean up all saved files from this batch if DB commit fails
        for fp in saved_file_paths:
            if fp.exists(): fp.unlink(missing_ok=True)
        print(f"Error saving photo record(s) to DB for user {user_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Could not save photo details to database.")

    # 4. Return data for the CREATED photo records in this request
    return created_photos_db


# --- Endpoint to Get User Photos (Relative Path) ---
@router.get(
    "/users/{user_id}",  # <<< PATH CHANGED: Relative to '/photos' prefix
    response_model=List[ProfilePhotoOut],
    summary="Get User's Photos"
)
def get_user_photos(user_id: int, db: Session = Depends(get_db)):
    # Verify user exists first is good practice
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    stmt = select(ProfilePhoto).where(ProfilePhoto.user_id == user_id).order_by(ProfilePhoto.is_primary.desc(),
                                                                                ProfilePhoto.uploaded_at)
    photos = db.scalars(stmt).all()
    return photos  # Returns empty list [] if user exists but no photos found


# --- Endpoint to Delete a Photo (Relative Path) ---
@router.delete(
    "/{photo_id}",  # <<< PATH CHANGED: Relative to '/photos' prefix, identifies photo directly
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a Photo"
)
# Removed user_id from path, as photo_id should be unique
def delete_photo(photo_id: int, db: Session = Depends(get_db)):
    # 1. Find the photo record
    # db_photo = db.get(ProfilePhoto, photo_id) <- Use this if loading by PK directly is desired
    stmt = select(ProfilePhoto).where(ProfilePhoto.photo_id == photo_id)
    db_photo = db.scalar(stmt)

    if not db_photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    # Add Authorization Check: Ensure the logged-in user owns this photo
    # current_user_id = ... # Get from auth token dependency
    # if db_photo.user_id != current_user_id:
    #     raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this photo")

    # Handle primary photo deletion more gracefully
    if db_photo.is_primary:
        # Find if other photos exist for the user
        other_photos_stmt = select(ProfilePhoto).where(
            ProfilePhoto.user_id == db_photo.user_id,
            ProfilePhoto.photo_id != photo_id  # Exclude the one being deleted
        ).order_by(ProfilePhoto.uploaded_at).limit(1)  # Get the oldest remaining

        next_primary = db.scalar(other_photos_stmt)
        if next_primary:
            # Set the next oldest as primary
            next_primary.is_primary = True
            # db.add(next_primary) # Usually not needed when modifying existing object
            print(f"Promoted photo {next_primary.photo_id} to primary for user {db_photo.user_id}")
        else:
            print(f"Deleting last photo for user {db_photo.user_id}, no primary remains.")

    # --- File Deletion ---
    # Construct path safely from the stored relative URL
    try:
        # Assuming photo_url is like '/static/user_photos/USERID/FILENAME.ext'
        relative_path_from_static = db_photo.photo_url.replace(SERVE_PATH_BASE, "", 1).lstrip('/')
        # Base directory where StaticFiles is mounted ('./static' assumed)
        static_dir = Path("./static").resolve()
        file_disk_path = (static_dir / relative_path_from_static).resolve()

        # Security check: ensure path is within the intended base directory
        if not file_disk_path.is_relative_to(static_dir / "user_photos"):
            raise ValueError("Attempt to access file outside designated directory.")

        if file_disk_path.exists() and file_disk_path.is_file():
            file_disk_path.unlink()
            print(f"Deleted file from disk: {file_disk_path}")
        else:
            print(f"Warning: File not found on disk for deletion: {file_disk_path}")

    except Exception as e:
        print(f"Error deleting file from disk {db_photo.photo_url}: {e}")
        # Decide if failure to delete file should prevent DB deletion (usually no)

    # --- DB Deletion ---
    try:
        db.delete(db_photo)
        db.commit()  # Commit deletion AND potential primary update
    except Exception as e:
        db.rollback()
        print(f"Error deleting photo record {photo_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete photo record.")

    return  # Return None for 204 status


# --- Endpoint to Set Primary Photo (Relative Path) ---
@router.put(
    "/{photo_id}/set_primary",  # <<< PATH CHANGED: Relative to '/photos' prefix
    response_model=ProfilePhotoOut,
    summary="Set Primary Photo"
)
def set_primary_photo(photo_id: int, db: Session = Depends(get_db)):
    # 1. Get the photo to be set as primary
    target_photo = db.get(ProfilePhoto, photo_id)
    if not target_photo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target photo not found")

    user_id = target_photo.user_id
    # Add Authorization Check: Ensure logged-in user owns this photo/user profile
    # current_user_id = ... # Get from auth dependency
    # if user_id != current_user_id:
    #    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    # --- Transaction ---
    try:
        # 2. Unset any existing primary photo for the user
        stmt_unmark_primary = (
            update(ProfilePhoto)
            .where(ProfilePhoto.user_id == user_id)
            .where(ProfilePhoto.photo_id != photo_id)  # Don't unset the target one
            .where(ProfilePhoto.is_primary == True)
            .values(is_primary=False)
        )
        db.execute(stmt_unmark_primary)

        # 3. Set the target photo as primary
        target_photo.is_primary = True
        # db.add(target_photo) # Not needed if fetched from session

        db.commit()
        db.refresh(target_photo)
    except Exception as e:
        db.rollback()
        print(f"Error setting primary photo {photo_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update primary photo.")

    return target_photo
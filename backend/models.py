# models.py
from sqlalchemy import (
    Column, Integer, String, Date, Enum as SQLAlchemyEnum, Text, TIMESTAMP,
    Table, ForeignKey, Boolean, UniqueConstraint, or_ # Added UniqueConstraint, or_
)
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

# --- Association Table for User <-> Interest ---
user_interests_association = Table(
    'user_interests_association', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.user_id', ondelete="CASCADE"), primary_key=True),
    Column('interest_id', Integer, ForeignKey('interests.interest_id', ondelete="CASCADE"), primary_key=True)
)

# Forward declaration for type hinting if needed
class Report: pass

# --- User Model (Added Report Relationships) ---
class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    gender = Column(SQLAlchemyEnum('male', 'female', 'non-binary', 'other', name='gender_types_db'), nullable=True)
    dob = Column(Date, nullable=True)
    location = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    # --- Existing Relationships ---
    interests = relationship("Interest", secondary=user_interests_association, back_populates="users", lazy='selectin')
    preferences = relationship("Preference", back_populates="user", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    photos = relationship(
        "ProfilePhoto", back_populates="user", cascade="all, delete-orphan", lazy="selectin",
        order_by="ProfilePhoto.is_primary.desc(), ProfilePhoto.uploaded_at"
    )
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan", lazy="selectin", order_by="desc(Subscription.start_date)")
    likes_given = relationship("Like", foreign_keys="Like.liker_id", back_populates="liker", cascade="all, delete-orphan", lazy="selectin")
    likes_received = relationship("Like", foreign_keys="Like.liked_id", back_populates="liked", cascade="all, delete-orphan", lazy="selectin")
    matches = relationship(
        "Match", primaryjoin=lambda: or_(User.user_id == foreign(Match.user_1_id), User.user_id == foreign(Match.user_2_id)),
        cascade="all, delete-orphan", lazy="selectin", order_by="desc(Match.matched_at)", viewonly=True
    )

    # --- NEW Relationships for Reports ---
    reports_made = relationship(
        "Report",
        foreign_keys="Report.reporter_id",
        back_populates="reporter",
        cascade="all, delete-orphan"
    )
    reports_received = relationship(
        "Report",
        foreign_keys="Report.reported_user_id",
        back_populates="reported_user",
        cascade="all, delete-orphan"
    )


# --- Interest Model ---
class Interest(Base):
    __tablename__ = "interests"
    interest_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=True, index=True)
    users = relationship("User", secondary=user_interests_association, back_populates="interests")

# --- Preference Model ---
class Preference(Base):
    __tablename__ = "preferences"
    preference_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), unique=True, nullable=False)
    preferred_gender = Column(String(50), nullable=True)
    age_min = Column(Integer, nullable=True)
    age_max = Column(Integer, nullable=True)
    location_radius_km = Column(Integer, nullable=True)
    user = relationship("User", back_populates="preferences")

# --- Profile Photo Model ---
class ProfilePhoto(Base):
    __tablename__ = "profile_photos"
    photo_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), nullable=False)
    photo_url = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    uploaded_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    user = relationship("User", back_populates="photos")

# --- Subscription Model ---
class Subscription(Base):
    __tablename__ = "subscriptions"
    subscription_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), nullable=False, index=True)
    plan_type = Column(SQLAlchemyEnum('basic', 'premium', 'platinum', name='plan_type_enum_db'), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False) # Assumes NOT NULL per last DB state
    status = Column(SQLAlchemyEnum('active', 'expired', 'cancelled', name='subscription_status_enum_db'), nullable=False)
    user = relationship("User", back_populates="subscriptions")

# --- Like Model ---
class Like(Base):
    __tablename__ = "likes"
    liker_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), primary_key=True)
    liked_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), primary_key=True)
    liked_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())

    liker = relationship("User", foreign_keys=[liker_id], back_populates="likes_given")
    liked = relationship("User", foreign_keys=[liked_id], back_populates="likes_received")

# --- Match Model ---
class Match(Base):
    __tablename__ = "matches"
    match_id = Column(Integer, primary_key=True, autoincrement=True)
    user_1_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), nullable=False)
    user_2_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), nullable=False)
    matched_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    __table_args__ = (UniqueConstraint('user_1_id', 'user_2_id', name='uq_match_pair'),)

    # Define overlaps to resolve warnings if needed
    user1 = relationship("User", foreign_keys=[user_1_id], overlaps="matches")
    user2 = relationship("User", foreign_keys=[user_2_id], overlaps="matches")

# --- Report Model (NEW) ---
class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, autoincrement=True)
    # Set reporter_id to NULL if the reporting user account is deleted
    reporter_id = Column(Integer, ForeignKey('users.user_id', ondelete="SET NULL"), nullable=True)
    # Cascade delete reports if the reported user account is deleted
    reported_user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), nullable=False, server_default=func.now())
    status = Column(
        SQLAlchemyEnum('pending', 'reviewed', 'action_taken', 'dismissed', name='report_status_enum_db'),
        nullable=False, default='pending', server_default='pending', index=True
    )
    moderator_notes = Column(Text, nullable=True)
    updated_at = Column(TIMESTAMP(timezone=True), nullable=True, onupdate=func.now()) # Auto update timestamp on change


    # Relationships back to User model using explicit foreign_keys
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_made")
    reported_user = relationship("User", foreign_keys=[reported_user_id], back_populates="reports_received")
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# MySQL connection URI; replace user/password/db as needed
DATABASE_URL = "mysql+pymysql://root:aditya009@localhost:3306/dating_app"

# Create SQLAlchemy engine for MySQL
engine = create_engine(DATABASE_URL)

# Create configured session class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()

# Dependency to get a SQLAlchemy session (for use in FastAPI routes)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

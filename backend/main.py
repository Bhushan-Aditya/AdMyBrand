# main.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pathlib import Path

# Import models module
import models

# Import ALL your routers
from users import router as users_router
from interests import router as interests_router
from preferences import router as preferences_router
from photos import router as photos_router
from subscriptions import router as subscriptions_router
from likes import router as likes_router
from matches import router as matches_router
from reports import router as reports_router     # <-- Import reports

# --- Database Setup ---
DATABASE_URL = "mysql+pymysql://root:aditya009@localhost:3306/dating_app"
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Create Tables ---
try:
    models.Base.metadata.create_all(bind=engine)
    print("Database tables checked/created successfully.")
except Exception as e:
    print(f"Error checking/creating database tables: {e}")

# --- Initialize FastAPI app ---
app = FastAPI(
    title="Dating App API",
    version="0.1.0",
    description="API for the Data Bridge Dating App"
    )

# --- Mount Static Files directory ---
try:
    static_dir = Path("./static")
    static_dir.mkdir(exist_ok=True)
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    print(f"Mounted static directory: {static_dir.resolve()}")
except Exception as e:
    print(f"Error mounting static directory './static': {e}")

# --- CORS configuration ---
origins = [ "http://localhost:3000", "http://127.0.0.1:3000" ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include ALL Routers ---
app.include_router(users_router, prefix="/users", tags=["Users"])
app.include_router(interests_router, prefix="/interests", tags=["Interests"])
app.include_router(preferences_router, prefix="/preferences", tags=["Preferences"])
app.include_router(photos_router, prefix="/photos", tags=["Photos"])
app.include_router(subscriptions_router, prefix="/subscriptions", tags=["Subscriptions"])
app.include_router(likes_router, prefix="/likes", tags=["Likes"])
app.include_router(matches_router, prefix="/matches", tags=["Matches"])
app.include_router(reports_router, prefix="/reports", tags=["Reports"]) # <-- Include Reports


# --- Root Endpoint ---
@app.get("/", tags=["Root"])
def read_root():
    """ Basic API health check endpoint. """
    return {"status": "Dating app backend is active!"}
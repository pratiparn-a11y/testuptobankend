from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database
from database import engine

models.Base.metadata.create_all(bind=engine)

def migrate_images():
    from sqlalchemy import text
    db = database.SessionLocal()
    try:
        # Check if memories table still has image_url column
        # Using raw SQL to be safe since the model already changed
        result = db.execute(text("SELECT id, image_url FROM memories WHERE image_url IS NOT NULL AND image_url != ''"))
        rows = result.fetchall()
        for row in rows:
            memory_id = row[0]
            url = row[1]
            # Check if this image already exists in new table to avoid duplicates
            exists = db.execute(text("SELECT 1 FROM memory_images WHERE memory_id = :mid AND url = :url"), {"mid": memory_id, "url": url}).fetchone()
            if not exists:
                db.execute(text("INSERT INTO memory_images (url, memory_id) VALUES (:url, :mid)"), {"url": url, "mid": memory_id})
        db.commit()
    except Exception as e:
        print(f"Migration error: {e}")
        db.rollback()
    finally:
        db.close()

# Run migration on start
migrate_images()

app = FastAPI()

# Allow frontend to access backend - Allow all origins for flexibility
# In production, you might want to restrict this to specific domains

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (Vercel generates different URLs)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Memory Keeper API"}

@app.get("/ping")
def ping():
    return {"status": "ok", "message": "Server is awake! 🚀"}

from routers import auth, memories
app.include_router(auth.router)
app.include_router(memories.router)

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database
from database import engine

models.Base.metadata.create_all(bind=engine)

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

from routers import auth, memories
app.include_router(auth.router)
app.include_router(memories.router)

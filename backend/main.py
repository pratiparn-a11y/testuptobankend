from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models, database
from database import engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Allow frontend to access backend
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://your-railway-app-url.up.railway.app" # Update this after deployment
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all. Restrict in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Memory Keeper API"}

from routers import auth, memories
app.include_router(auth.router)
app.include_router(memories.router)

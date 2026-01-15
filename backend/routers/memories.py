from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import database, models, auth
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/memories",
    tags=["Memories"]
)

class MemoryCreate(BaseModel):
    title: str
    note: Optional[str] = None
    image_url: Optional[str] = None

class MemoryResponse(BaseModel):
    id: int
    title: str
    note: Optional[str]
    image_url: Optional[str]
    created_at: datetime
    
    class Config:
        orm_mode = True

@router.post("/", response_model=MemoryResponse)
def create_memory(
    memory: MemoryCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_memory = models.Memory(**memory.dict(), owner_id=current_user.id)
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

@router.get("/", response_model=List[MemoryResponse])
def get_memories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    memories = db.query(models.Memory).filter(models.Memory.owner_id == current_user.id).offset(skip).limit(limit).all()
    return memories

@router.delete("/{memory_id}")
def delete_memory(
    memory_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    memory = db.query(models.Memory).filter(models.Memory.id == memory_id, models.Memory.owner_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    db.delete(memory)
    db.commit()
    return {"message": "Memory deleted"}

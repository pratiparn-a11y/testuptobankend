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

import logging
import traceback

logger = logging.getLogger(__name__)

from fastapi import File, UploadFile, Form
from cloudinary_config import upload_image

@router.post("/", response_model=MemoryResponse)
def create_memory(
    title: str = Form(...),
    note: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        final_image_url = image_url
        
        if image and image.filename:
            logger.info(f"Uploading image to Cloudinary: {image.filename}")
            uploaded_url, cloudinary_error = upload_image(image.file)
            if uploaded_url:
                final_image_url = uploaded_url
            else:
                logger.error(f"Cloudinary upload failed: {cloudinary_error}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Cloudinary upload failed: {cloudinary_error}. Please check Render environment variables."
                )
        
        db_memory = models.Memory(
            title=title,
            note=note,
            image_url=final_image_url,
            owner_id=current_user.id
        )
        db.add(db_memory)
        db.commit()
        db.refresh(db_memory)
        return db_memory
    except Exception as e:
        logger.error(f"Error creating memory: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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

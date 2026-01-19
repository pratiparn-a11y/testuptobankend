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

class MemoryImageResponse(BaseModel):
    id: int
    url: str
    
    class Config:
        from_attributes = True

class MemoryResponse(BaseModel):
    id: int
    title: str
    note: Optional[str]
    images: List[MemoryImageResponse] = []
    created_at: datetime
    
    class Config:
        from_attributes = True

import logging
import traceback

logger = logging.getLogger(__name__)

from fastapi import File, UploadFile, Form
from cloudinary_config import upload_image

@router.post("/", response_model=MemoryResponse)
def create_memory(
    title: str = Form(...),
    note: Optional[str] = Form(None),
    images: List[UploadFile] = File(None),
    image_urls: Optional[str] = Form(None), # Comma separated URLs if any
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    try:
        db_memory = models.Memory(
            title=title,
            note=note,
            owner_id=current_user.id
        )
        db.add(db_memory)
        db.commit()
        db.refresh(db_memory)

        final_images = []
        
        # Handle uploaded files
        if images:
            for image in images:
                if image.filename:
                    logger.info(f"Uploading image to Cloudinary: {image.filename}")
                    uploaded_url, cloudinary_error = upload_image(image.file)
                    if uploaded_url:
                        db_image = models.MemoryImage(url=uploaded_url, memory_id=db_memory.id)
                        db.add(db_image)
                        final_images.append(db_image)
                    else:
                        logger.error(f"Cloudinary upload failed: {cloudinary_error}")
                        # Optionally we could fail the whole request or just skip
        
        # Handle image URLs (if user provided them via the old URL input)
        if image_urls:
            urls = [u.strip() for u in image_urls.split(",") if u.strip()]
            for url in urls:
                db_image = models.MemoryImage(url=url, memory_id=db_memory.id)
                db.add(db_image)
                final_images.append(db_image)
        
        db.commit()
        db.refresh(db_memory)
        return db_memory
    except Exception as e:
        logger.error(f"Error creating memory: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

from sqlalchemy.orm import Session, joinedload

@router.get("/", response_model=List[MemoryResponse])
def get_memories(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    memories = db.query(models.Memory).options(joinedload(models.Memory.images)).filter(models.Memory.owner_id == current_user.id).offset(skip).limit(limit).all()
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

@router.delete("/images/{image_id}")
def delete_memory_image(
    image_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Find the image and ensure it belongs to a memory owned by current_user
    image = db.query(models.MemoryImage).join(models.Memory).filter(
        models.MemoryImage.id == image_id,
        models.Memory.owner_id == current_user.id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found or access denied")
    
    db.delete(image)
    db.commit()
    return {"message": "Image deleted successfully"}

@router.put("/{memory_id}", response_model=MemoryResponse)
def update_memory(
    memory_id: int,
    title: Optional[str] = Form(None),
    note: Optional[str] = Form(None),
    images: List[UploadFile] = File(None),
    image_urls: Optional[str] = Form(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_memory = db.query(models.Memory).filter(models.Memory.id == memory_id, models.Memory.owner_id == current_user.id).first()
    if not db_memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    
    if title is not None:
        db_memory.title = title
    if note is not None:
        db_memory.note = note
    
    # Handle new uploaded files
    if images:
        for image in images:
            if image.filename:
                uploaded_url, cloudinary_error = upload_image(image.file)
                if uploaded_url:
                    db_image = models.MemoryImage(url=uploaded_url, memory_id=db_memory.id)
                    db.add(db_image)
    
    # Handle new image URLs
    if image_urls:
        urls = [u.strip() for u in image_urls.split(",") if u.strip()]
        for url in urls:
            db_image = models.MemoryImage(url=url, memory_id=db_memory.id)
            db.add(db_image)
            
    db.commit()
    db.refresh(db_memory)
    return db_memory

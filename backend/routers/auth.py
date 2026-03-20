from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
import database, models, auth
from pydantic import BaseModel
from datetime import timedelta
import logging
import traceback
from cloudinary_config import delete_image

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Authentication"]
)

class UserCreate(BaseModel):
    username: str
    password: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    avatar_url: Optional[str] = None
    partner_name: Optional[str] = None
    anniversary: Optional[str] = None
    notification_message: Optional[str] = None

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(database.get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        hashed_password = auth.get_password_hash(user.password)
        db_user = models.User(username=user.username, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return {"username": db_user.username, "message": "User created successfully"}
    except Exception as e:
        logger.error(f"Error during registration: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "username": current_user.username, 
        "id": current_user.id,
        "avatar_url": current_user.avatar_url,
        "partner_name": current_user.partner_name,
        "anniversary": current_user.anniversary,
        "notification_message": current_user.notification_message
    }

@router.put("/me")
@router.put("/me/")
def update_user_profile(
    user_update: UserUpdate, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    try:
        if user_update.password:
            current_user.hashed_password = auth.get_password_hash(user_update.password)
        
        if user_update.avatar_url is not None:
            # โค๊ดส่วนเปลี่ยนโปรไฟล์ลบรูปเก่า
            # old_avatar_url = current_user.avatar_url
            current_user.avatar_url = user_update.avatar_url
            # if old_avatar_url and old_avatar_url != user_update.avatar_url:
            #     success, error = delete_image(old_avatar_url)
            #     if not success:
            #         logger.warning(f"Failed to delete old avatar {old_avatar_url}: {error}")
            # โค๊ดส่วนเปลี่ยนโปรไฟล์ลบรูปเก่า
            
        if user_update.partner_name is not None:
            current_user.partner_name = user_update.partner_name
            
        if user_update.anniversary is not None:
            current_user.anniversary = user_update.anniversary
            
        if user_update.notification_message is not None:
            current_user.notification_message = user_update.notification_message
            
        db.commit()
        db.refresh(current_user)
        return {"message": "Profile updated successfully"}
    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating profile: {str(e)}")

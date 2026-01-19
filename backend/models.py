from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    memories = relationship("Memory", back_populates="owner")

class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="memories")
    images = relationship("MemoryImage", back_populates="memory", cascade="all, delete-orphan")

class MemoryImage(Base):
    __tablename__ = "memory_images"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String)
    memory_id = Column(Integer, ForeignKey("memories.id"))

    memory = relationship("Memory", back_populates="images")

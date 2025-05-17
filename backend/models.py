from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True)
    hashed_password = Column(String)

class Stroke(Base):
    __tablename__ = "strokes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    tool = Column(String)
    color = Column(String)
    points = Column(JSON)
    timestamp = Column(DateTime, default=datetime.now)
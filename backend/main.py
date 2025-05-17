# backend/main.py

import os, json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
from typing import List, Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from models import User, Stroke, Base
from pydantic import BaseModel

# App
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# DB
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/postgres")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def get_password_hash(password): return pwd_context.hash(password)
def create_access_token(data: dict): return jwt.encode(
    {**data, "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)},
    SECRET_KEY, algorithm=ALGORITHM
)

# Models
class RegistrationData(BaseModel):
    username: str
    password: str

# Register
@app.post("/register")
async def register(data: RegistrationData, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    user = User(username=data.username, hashed_password=get_password_hash(data.password))
    db.add(user)
    db.commit()
    return {
        "access_token": create_access_token({"sub": data.username}),
        "token_type": "bearer"
    }

# Login
from fastapi.security import OAuth2PasswordRequestForm
@app.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {
        "access_token": create_access_token({"sub": user.username}),
        "token_type": "bearer"
    }

# Sync strokes
@app.get("/sync")
async def sync_canvas(db: Session = Depends(get_db)):
    return [{
        "id": s.id,
        "user_id": s.user_id,
        "tool": s.tool,
        "color": s.color,
        "lineWidth": 2,
        "points": s.points,
        "timestamp": s.timestamp.isoformat()
    } for s in db.query(Stroke).all()]

# WebSocket manager
class ConnectionManager:
    def __init__(self): self.active: List[WebSocket] = []
    async def connect(self, ws: WebSocket): await ws.accept(); self.active.append(ws)
    def disconnect(self, ws: WebSocket): self.active.remove(ws)
    async def broadcast(self, msg: str, sender: WebSocket): 
        for conn in self.active:
            if conn != sender:
                await conn.send_text(msg)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    token = ws.query_params.get("token")
    if not token:
        await ws.accept()
        await ws.send_text(json.dumps({"type": "error", "message": "Missing token"}))
        await ws.close(code=4001)
        return

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        db = SessionLocal()
        user = db.query(User).filter(User.username == username).first()
        if not user:
            await ws.accept()
            await ws.send_text(json.dumps({"type": "error", "message": "Invalid user"}))
            await ws.close(code=4002)
            return

        await manager.connect(ws)
        print(f"✅ {username} connected via WebSocket")

        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            if data["type"] == "stroke":
                stroke = Stroke(
                    user_id=user.id,
                    tool="brush",
                    color=data.get("color", "#000000"),
                    points=data["points"],
                    timestamp=datetime.utcnow()
                )
                db.add(stroke)
                db.commit()
                await manager.broadcast(raw, sender=ws)

            elif data["type"] == "clear":
                # TODO: Очистка базы, если нужно
                await manager.broadcast(raw, sender=ws)

    except WebSocketDisconnect:
        manager.disconnect(ws)
        print("🔌 WebSocket disconnected")
    except JWTError:
        await ws.accept()
        await ws.send_text(json.dumps({"type": "error", "message": "Invalid token"}))
        await ws.close(code=4003)
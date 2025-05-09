from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Разрешаем CORS (например, если фронтенд будет обращаться с localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # позже можно ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to DrawWithMe API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/hello")
def hello():
    return {"message": "Hello from backend!"}
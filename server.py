from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager
import os
import shutil
from pathlib import Path
import database as db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.init_db()
    print("SQLite veritabani basarili")
    yield
    # Shutdown
    pass

app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload klasörü
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# JWT Secret
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 saat

# Utility functions
def verify_password(plain_password, hashed_password):
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except:
        return False

def get_password_hash(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Startup handled in lifespan

# Static files
app.mount("/static", StaticFiles(directory="public"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# API Endpoints
@app.post("/api/register")
async def register(username: str = Form(...), email: str = Form(...), password: str = Form(...)):
    # Şifre kontrolü - minimum 8 karakter
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Şifre en az 8 karakter olmalıdır")
    
    # Kullanıcı kontrolü
    username_exists, email_exists = await db.check_user_exists(username, email)
    
    if username_exists:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten kullanılıyor")
    if email_exists:
        raise HTTPException(status_code=400, detail="Bu email zaten kullanılıyor")
    
    # Yeni kullanıcı oluştur
    hashed_password = get_password_hash(password)
    success = await db.create_user(username, email, hashed_password)
    
    if success:
        return {"message": "Kayıt başarılı"}
    else:
        raise HTTPException(status_code=400, detail="Kayıt işlemi başarısız")

@app.post("/api/login")
async def login(username: str = Form(...), password: str = Form(...)):
    user = await db.get_user(username)
    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Kullanıcı adı veya şifre hatalı")
    
    access_token = create_access_token(data={"sub": user["username"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"]
    }

@app.get("/api/me")
async def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Geçersiz token")
        user = await db.get_user(username)
        if user is None:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        return {"username": user["username"], "email": user["email"]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

@app.post("/api/products")
async def create_product(
    title: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    currency: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    seller: str = Form(...),
    images: list[UploadFile] = File(...)
):
    image_paths = []
    for image in images:
        # Resim kaydet
        file_path = UPLOAD_DIR / f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_paths.append(str(file_path))
    
    product_id = await db.create_product(title, description, price, currency, category, location, seller, image_paths)
    return {"product_id": product_id}

@app.get("/api/products")
async def get_products(category: Optional[str] = None, location: Optional[str] = None, search: Optional[str] = None):
    products = await db.get_products(category, location, search)
    for product in products:
        product["id"] = str(product["id"])  # JSON serialization için
    return products

@app.get("/api/products/{product_id}")
async def get_product(product_id: str):
    try:
        product = await db.get_product(int(product_id))
        if not product:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        product["id"] = str(product["id"])
        return product
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Geçersiz ürün ID")

@app.delete("/api/products/{product_id}")
async def delete_product(product_id: str, seller: str):
    try:
        # Ürün bilgisini al
        product = await db.get_product(int(product_id))
        if not product:
            raise HTTPException(status_code=404, detail="Ürün bulunamadı")
        
        if product["seller"] != seller:
            raise HTTPException(status_code=403, detail="Bu ürünü silme yetkiniz yok")
        
        # Resimleri sil
        for image_path in product.get("images", []):
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except:
                    pass
        
        success = await db.delete_product(int(product_id), seller)
        if not success:
            raise HTTPException(status_code=403, detail="Ürün silinemedi")
        
        return {"message": "Ürün silindi"}
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Geçersiz ürün ID")

@app.post("/api/messages")
async def send_message(
    sender: str = Form(...),
    receiver: str = Form(...),
    product_id: str = Form(...),
    message: str = Form(...),
    file: UploadFile = File(None)
):
    file_path = None
    if file:
        # Dosya kaydet
        file_path = UPLOAD_DIR / f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_path = str(file_path)
    
    message_id = await db.create_message(sender, receiver, int(product_id), message, file_path)
    return {"message_id": message_id}

@app.get("/api/messages")
async def get_messages(username: str):
    messages = await db.get_messages(username)
    for msg in messages:
        msg["id"] = str(msg["id"])
    return messages

@app.put("/api/messages/{message_id}/read")
async def mark_message_read(message_id: str):
    await db.mark_message_read(int(message_id))
    return {"message": "Okundu olarak işaretlendi"}

# Ana sayfa
@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("public/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/login", response_class=HTMLResponse)
async def login_page():
    with open("public/login.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/register", response_class=HTMLResponse)
async def register_page():
    with open("public/register.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/messages", response_class=HTMLResponse)
async def messages_page():
    with open("public/messages.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/product/{product_id}", response_class=HTMLResponse)
async def product_page():
    with open("public/product.html", "r", encoding="utf-8") as f:
        return f.read()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
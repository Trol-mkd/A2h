import aiosqlite
import json
import os
from typing import Optional, List, Dict
from datetime import datetime

DB_FILE = "a2hand.db"

async def init_db():
    """Veritabanını başlat ve tabloları oluştur"""
    async with aiosqlite.connect(DB_FILE) as db:
        # Kullanıcılar tablosu
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        
        # Ürünler tablosu
        await db.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                price REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'EUR',
                category TEXT NOT NULL,
                location TEXT NOT NULL,
                seller TEXT NOT NULL,
                images TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (seller) REFERENCES users(username)
            )
        """)
        
        # Eski veritabanlarında currency kolonu yoksa ekle
        try:
            await db.execute("ALTER TABLE products ADD COLUMN currency TEXT DEFAULT 'EUR'")
            await db.commit()
        except:
            pass
        
        # Mesajlar tablosu
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sender TEXT NOT NULL,
                receiver TEXT NOT NULL,
                product_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                file_path TEXT,
                created_at TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                FOREIGN KEY (sender) REFERENCES users(username),
                FOREIGN KEY (receiver) REFERENCES users(username),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        """)
        
        # Eski veritabanlarında file_path kolonu yoksa ekle
        try:
            await db.execute("ALTER TABLE messages ADD COLUMN file_path TEXT")
            await db.commit()
        except:
            pass
        
        await db.commit()

# Kullanıcı işlemleri
async def create_user(username: str, email: str, password: str) -> bool:
    """Yeni kullanıcı oluştur"""
    try:
        async with aiosqlite.connect(DB_FILE) as db:
            await db.execute(
                "INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, ?)",
                (username, email, password, datetime.utcnow().isoformat())
            )
            await db.commit()
            return True
    except aiosqlite.IntegrityError:
        return False

async def get_user(username: str) -> Optional[Dict]:
    """Kullanıcı bilgisini getir"""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM users WHERE username = ?", (username,)) as cursor:
            row = await cursor.fetchone()
            if row:
                return dict(row)
            return None

async def check_user_exists(username: str, email: str) -> tuple:
    """Kullanıcı adı ve email kontrolü"""
    async with aiosqlite.connect(DB_FILE) as db:
        # Kullanıcı adı kontrolü
        async with db.execute("SELECT 1 FROM users WHERE username = ?", (username,)) as cursor:
            username_exists = await cursor.fetchone() is not None
        
        # Email kontrolü
        async with db.execute("SELECT 1 FROM users WHERE email = ?", (email,)) as cursor:
            email_exists = await cursor.fetchone() is not None
        
        return username_exists, email_exists

# Ürün işlemleri
async def create_product(title: str, description: str, price: float, currency: str, 
                         category: str, location: str, seller: str, images: List[str]) -> int:
    """Yeni ürün oluştur"""
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute(
            """INSERT INTO products (title, description, price, currency, category, location, seller, images, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (title, description, price, currency, category, location, seller, json.dumps(images), 
             datetime.utcnow().isoformat())
        )
        await db.commit()
        return cursor.lastrowid

async def get_products(category: Optional[str] = None, location: Optional[str] = None, 
                       search: Optional[str] = None) -> List[Dict]:
    """Ürünleri getir"""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        query = "SELECT * FROM products WHERE 1=1"
        params = []
        
        if category:
            query += " AND category = ?"
            params.append(category)
        
        if location:
            query += " AND location = ?"
            params.append(location)
        
        if search:
            query += " AND (title LIKE ? OR description LIKE ?)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term])
        
        query += " ORDER BY created_at DESC"
        
        async with db.execute(query, params) as cursor:
            rows = await cursor.fetchall()
            products = []
            for row in rows:
                product = dict(row)
                product['images'] = json.loads(product['images'])
                products.append(product)
            return products

async def get_product(product_id: int) -> Optional[Dict]:
    """Tek ürün getir"""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM products WHERE id = ?", (product_id,)) as cursor:
            row = await cursor.fetchone()
            if row:
                product = dict(row)
                product['images'] = json.loads(product['images'])
                return product
            return None

async def delete_product(product_id: int, seller: str) -> bool:
    """Ürün sil"""
    async with aiosqlite.connect(DB_FILE) as db:
        # Önce ürünün sahibi olduğunu kontrol et
        async with db.execute("SELECT seller FROM products WHERE id = ?", (product_id,)) as cursor:
            row = await cursor.fetchone()
            if not row or row[0] != seller:
                return False
        
        await db.execute("DELETE FROM products WHERE id = ?", (product_id,))
        await db.commit()
        return True

# Mesaj işlemleri
async def create_message(sender: str, receiver: str, product_id: int, message: str, file_path: str = None) -> int:
    """Yeni mesaj oluştur"""
    async with aiosqlite.connect(DB_FILE) as db:
        cursor = await db.execute(
            """INSERT INTO messages (sender, receiver, product_id, message, file_path, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (sender, receiver, product_id, message, file_path, datetime.utcnow().isoformat())
        )
        await db.commit()
        return cursor.lastrowid

async def get_messages(username: str) -> List[Dict]:
    """Kullanıcının mesajlarını getir"""
    async with aiosqlite.connect(DB_FILE) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT * FROM messages WHERE sender = ? OR receiver = ? ORDER BY created_at DESC",
            (username, username)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def mark_message_read(message_id: int):
    """Mesajı okundu olarak işaretle"""
    async with aiosqlite.connect(DB_FILE) as db:
        await db.execute("UPDATE messages SET read = 1 WHERE id = ?", (message_id,))
        await db.commit()

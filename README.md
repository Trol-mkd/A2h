# A2hand - İkinci El Alışveriş Platformu

A2hand, Letgo benzeri ikinci el ürün alım-satım platformudur. Modern web teknolojileri ile geliştirilmiştir.

## Özellikler

- ✅ Kullanıcı kaydı ve girişi
- ✅ İlan ekleme ve silme (resimlerle birlikte)
- ✅ Gelişmiş ürün arama teknolojisi
- ✅ Kullanıcılar arası mesajlaşma
- ✅ Kategori ve konum filtreleme
- ✅ Modern ve responsive UI
- ✅ SQLite dosya tabanlı veritabanı (sunucu gerektirmez!)

## Kurulum

### Gereksinimler

- Python 3.8+
- pip

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

2. Uygulamayı başlatın:
```bash
# Windows
python server.py
# veya
start.bat
```

3. Tarayıcıda şu adresi açın:
```
http://localhost:8000
```

**Not**: Veriler SQLite veritabanında `a2hand.db` dosyası olarak saklanır. Sunucuya gerek yok!

## Kullanım

1. **Kayıt Ol**: Ana sayfadan "Kayıt Ol" butonuna tıklayarak yeni hesap oluşturun
2. **Giriş Yap**: Kullanıcı adı ve şifrenizle giriş yapın
3. **İlan Ver**: Giriş yaptıktan sonra "+" butonuna tıklayarak yeni ürün ekleyin
4. **Ara**: Üst menüden kategori, konum filtreleri ve arama kutusunu kullanın
5. **Mesajlaş**: Ürün detayından "Satıcıya Mesaj Gönder" butonuna tıklayın

## Teknolojiler

- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: JWT
- **Image Upload**: Python Multipart

## API Endpoints

- `POST /api/register` - Kullanıcı kaydı
- `POST /api/login` - Giriş
- `GET /api/me` - Kullanıcı bilgisi
- `POST /api/products` - İlan ekleme
- `GET /api/products` - Ürün listesi
- `GET /api/products/{id}` - Ürün detayı
- `DELETE /api/products/{id}` - İlan silme
- `POST /api/messages` - Mesaj gönderme
- `GET /api/messages` - Mesajları getirme

## Notlar

- Resimler `uploads/` klasöründe saklanır
- JWT token 24 saat geçerli
- Ürün arama teknolojisi MongoDB'nin text search özelliğini kullanır

## Lisans

Bu proje eğitim amaçlıdır.

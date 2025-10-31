document.addEventListener('DOMContentLoaded', () => {
  function getLocationName(location) {
    const locationNames = {
      skopje: 'Skopje', bitola: 'Bitola', kumanovo: 'Kumanovo', prilep: 'Prilep',
      tetovo: 'Tetovo', ohrid: 'Ohrid', veles: 'Veles', stip: 'Štip',
      gostivar: 'Gostivar', strumica: 'Strumica'
    };
    return locationNames[location] || location;
  }
  
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const productDetails = document.getElementById('productDetails');
  const userInfo = document.getElementById('userInfo');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const messagesLink = document.getElementById('messagesLink');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');

  // Mobile menu
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Auth UI
  function setAuthUI() {
    const isLoggedIn = !!token && !!username;
    if (userInfo) userInfo.style.display = isLoggedIn ? 'inline' : 'none';
    if (messagesLink) messagesLink.style.display = isLoggedIn ? 'inline' : 'none';
    if (loginBtn) loginBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
    if (registerBtn) registerBtn.style.display = isLoggedIn ? 'none' : 'inline-block';
    if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'inline-block' : 'none';
    if (userInfo && isLoggedIn) userInfo.textContent = `👤 ${username}`;
  }
  setAuthUI();

  if (loginBtn) loginBtn.addEventListener('click', () => location.href = '/login');
  if (registerBtn) registerBtn.addEventListener('click', () => location.href = '/register');
  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    location.reload();
  });

  // Get product ID from URL
  const pathParts = window.location.pathname.split('/');
  const productId = pathParts[pathParts.length - 1];

  if (!productId || productId === 'product') {
    productDetails.innerHTML = '<div style="text-align: center; padding: 3rem;"><p>Ürün bulunamadı.</p><a href="/" class="btn btn-primary">Ana Sayfaya Dön</a></div>';
    return;
  }

  async function loadProduct() {
    try {
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) throw new Error('Product not found');
      const product = await res.json();
      
      const storedLang = localStorage.getItem('lang') || 'tr';
      const dict = {
        tr: {
          price: 'Fiyat', category: 'Kategori', location: 'Konum', seller: 'Satıcı',
          description: 'Açıklama', contactSeller: 'Satıcıya Mesaj Gönder', back: 'Geri', delete: 'Sil',
          deleteConfirm: 'Bu ilanı silmek istediğinizden emin misiniz?', deleted: 'İlan silindi',
          deleteError: 'İlan silinemedi', contactError: 'Mesaj gönderilemedi', notLoggedIn: 'Mesaj göndermek için giriş yapın'
        },
        en: {
          price: 'Price', category: 'Category', location: 'Location', seller: 'Seller',
          description: 'Description', contactSeller: 'Contact Seller', back: 'Back', delete: 'Delete',
          deleteConfirm: 'Are you sure you want to delete this listing?', deleted: 'Listing deleted',
          deleteError: 'Failed to delete listing', contactError: 'Failed to send message', notLoggedIn: 'Please login to send message'
        },
        mk: {
          price: 'Цена', category: 'Категорија', location: 'Локација', seller: 'Продавач',
          description: 'Опис', contactSeller: 'Контактирај го продавачот', back: 'Назад', delete: 'Избриши',
          deleteConfirm: 'Дали сте сигурни дека сакате да го избришете овој оглас?', deleted: 'Огласот е избришан',
          deleteError: 'Не може да се избрише огласот', contactError: 'Не може да се испрати порака', notLoggedIn: 'Ве молиме најавете се за да испратите порака'
        }
      };
      const texts = dict[storedLang] || dict.tr;

      const isOwner = token && username === product.seller;
      const images = product.images || [];
      
      productDetails.innerHTML = `
        <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); margin-bottom: 2rem;">
          ${images.length > 0 ? `
            <div style="position: relative; width: 100%; max-height: 500px; overflow: hidden; background: #f7fafc; aspect-ratio: 1;">
              <img id="mainImg" src="/${images[0].replace(/^\/?/, '')}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
              ${images.length > 1 ? `<div style="position: absolute; bottom: 1rem; right: 1rem; background: rgba(0,0,0,0.7); color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">${images.length} resim</div>` : ''}
            </div>
            ${images.length > 1 ? `
              <div style="display: flex; gap: 0.5rem; padding: 1rem; overflow-x: auto; background: #f7fafc; -webkit-overflow-scrolling: touch;">
                ${images.map((img, idx) => `
                  <img src="/${img.replace(/^\/?/, '')}" alt="Thumb ${idx+1}" 
                       onclick="const mainImg = document.getElementById('mainImg'); if(mainImg) mainImg.src = this.src; this.style.borderColor='#667eea';" 
                       style="min-width: 80px; width: 80px; height: 80px; object-fit: cover; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;"
                       onmouseover="this.style.borderColor='#667eea'; this.style.transform='scale(1.05)'"
                       onmouseout="if(!this.classList.contains('selected')) { this.style.borderColor='transparent'; this.style.transform='scale(1)'; }">
                `).join('')}
              </div>
            ` : ''}
          ` : ''}
          
          <div style="padding: 1.5rem;">
            <div style="margin-bottom: 1.5rem;">
              <div style="flex: 1;">
                <h1 style="font-size: 1.75rem; margin-bottom: 0.5rem; color: #2d3748; line-height: 1.3;">${product.title}</h1>
                <div style="font-size: 1.75rem; font-weight: bold; color: #667eea; margin-bottom: 1rem;">${product.price} ${product.currency || 'EUR'}</div>
              </div>
              ${isOwner ? `
                <button id="deleteBtn" class="btn btn-danger" style="width: 100%; margin-top: 1rem;" data-translate="delete">Sil</button>
              ` : ''}
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem; padding: 1.25rem; background: #f7fafc; border-radius: 10px;">
              <div>
                <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;" data-translate="category">Kategori</div>
                <div style="font-weight: 600; color: #2d3748;">${product.category}</div>
              </div>
              <div>
                <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;" data-translate="location">Konum</div>
                <div style="font-weight: 600; color: #2d3748;">${getLocationName(product.location)}</div>
              </div>
              <div>
                <div style="font-size: 0.875rem; color: #718096; margin-bottom: 0.25rem;" data-translate="seller">Satıcı</div>
                <div style="font-weight: 600; color: #2d3748;">${product.seller}</div>
              </div>
            </div>
            
            <div style="margin-bottom: 2rem;">
              <h2 style="font-size: 1.25rem; margin-bottom: 0.75rem; color: #2d3748;" data-translate="description">Açıklama</h2>
              <div style="line-height: 1.8; color: #4a5568; white-space: pre-wrap; word-wrap: break-word;">${product.description || ''}</div>
            </div>
            
            ${!isOwner && token ? `
              <button id="contactBtn" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1rem; margin-bottom: 1rem;" data-translate="contactSeller">Satıcıya Mesaj Gönder</button>
            ` : !isOwner ? `
              <a href="/login" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1rem; text-align: center; display: block; margin-bottom: 1rem;" data-translate="contactSeller">Satıcıya Mesaj Gönder</a>
            ` : ''}
            
            <div style="margin-top: 1.5rem; text-align: center;">
              <a href="/" class="btn btn-outline" style="width: 100%; padding: 0.875rem;" data-translate="back">Geri</a>
            </div>
          </div>
        </div>
      `;

      // Delete button
      const deleteBtn = document.getElementById('deleteBtn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
          if (!confirm(texts.deleteConfirm)) return;
          try {
            const res = await fetch(`/api/products/${productId}?seller=${encodeURIComponent(username)}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            alert(texts.deleted);
            location.href = '/';
          } catch (e) {
            alert(texts.deleteError);
          }
        });
      }

      // Contact seller button
      const contactBtn = document.getElementById('contactBtn');
      if (contactBtn && token) {
        contactBtn.addEventListener('click', () => {
          location.href = `/messages?product=${productId}&seller=${encodeURIComponent(product.seller)}`;
        });
      }
    } catch (e) {
      productDetails.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #f56565; margin-bottom: 1.5rem; font-size: 1rem;">Ürün bulunamadı veya yüklenemedi.</p>
          <a href="/" class="btn btn-primary" style="width: 100%; max-width: 200px; padding: 1rem;" data-translate="back">Geri</a>
        </div>
      `;
    }
  }

  loadProduct();
});


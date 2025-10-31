document.addEventListener('DOMContentLoaded', () => {
  // Auth state
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const userInfo = document.getElementById('userInfo');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const messagesLink = document.getElementById('messagesLink');

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

  // Mobile menu
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Add product modal (only if logged in)
  const addProductModal = document.getElementById('addProductModal');
  const closeBtn = addProductModal ? addProductModal.querySelector('.close') : null;
  function openModal() { if (addProductModal) addProductModal.style.display = 'block'; }
  function closeModal() { if (addProductModal) addProductModal.style.display = 'none'; }
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  window.addEventListener('click', (e) => { if (e.target === addProductModal) closeModal(); });

  // Show modal button when logged in: create a floating "+" FAB
  if (token && username) {
    const fab = document.createElement('button');
    fab.textContent = '+';
    fab.setAttribute('aria-label', 'Yeni ilan');
    fab.style.position = 'fixed';
    fab.style.right = '16px';
    fab.style.bottom = '16px';
    fab.style.width = '56px';
    fab.style.height = '56px';
    fab.style.borderRadius = '50%';
    fab.style.border = 'none';
    fab.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    fab.style.color = '#fff';
    fab.style.fontSize = '28px';
    fab.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    fab.style.cursor = 'pointer';
    fab.addEventListener('click', openModal);
    document.body.appendChild(fab);
  }

  // Load products
  const productsContainer = document.getElementById('productsContainer');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const categoryFilter = document.getElementById('categoryFilter');
  const locationFilter = document.getElementById('locationFilter');

  async function loadProducts() {
    if (!productsContainer) return;
    const params = new URLSearchParams();
    if (categoryFilter && categoryFilter.value) params.append('category', categoryFilter.value);
    if (locationFilter && locationFilter.value) params.append('location', locationFilter.value);
    if (searchInput && searchInput.value) params.append('search', searchInput.value.trim());
    const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
    productsContainer.innerHTML = '<div class="loading">Yükleniyor...</div>';
    try {
      const res = await fetch(url);
      const list = await res.json();
      productsContainer.innerHTML = '';
      if (!Array.isArray(list) || list.length === 0) {
        productsContainer.innerHTML = '<p>Ürün bulunamadı.</p>';
        return;
      }
      list.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const img = (p.images && p.images[0]) ? p.images[0] : null;
        // Format location name
        const locationNames = {
          skopje: 'Skopje', bitola: 'Bitola', kumanovo: 'Kumanovo', prilep: 'Prilep',
          tetovo: 'Tetovo', ohrid: 'Ohrid', veles: 'Veles', stip: 'Štip',
          gostivar: 'Gostivar', strumica: 'Strumica'
        };
        const locationName = locationNames[p.location] || p.location;
        
        card.innerHTML = `
          ${img ? `<div class="product-image"><img src="/${img.replace(/^\/?/, '')}" alt="${p.title}" loading="lazy"></div>` : '<div class="product-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">📷</div>'}
          <div class="product-info">
            <h3 class="product-title">${p.title}</h3>
            <p class="product-price">${p.price} ${p.currency || 'EUR'}</p>
            <p class="product-meta">${p.category} • ${locationName}</p>
            <button class="btn btn-outline" data-id="${p.id}">Detay</button>
          </div>
        `;
        card.querySelector('button').addEventListener('click', () => {
          location.href = `/product/${p.id}`;
        });
        productsContainer.appendChild(card);
      });
    } catch (e) {
      productsContainer.innerHTML = '<p>Ürünler yüklenemedi.</p>';
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', loadProducts);
  if (categoryFilter) categoryFilter.addEventListener('change', loadProducts);
  if (locationFilter) locationFilter.addEventListener('change', loadProducts);
  loadProducts();

  // Image crop and preview
  const imageInput = document.getElementById('imageInput');
  const imagePreview = document.getElementById('imagePreview');
  const croppedImages = [];
  
  if (imageInput && imagePreview) {
    imageInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      imagePreview.innerHTML = '';
      croppedImages.length = 0;
      
      files.forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '200px';
          img.style.borderRadius = '8px';
          img.style.objectFit = 'contain';
          img.style.cursor = 'pointer';
          
          const container = document.createElement('div');
          container.style.position = 'relative';
          container.style.border = '2px solid #e2e8f0';
          container.style.borderRadius = '8px';
          container.style.padding = '0.5rem';
          container.style.background = '#f7fafc';
          
          const canvas = document.createElement('canvas');
          canvas.style.display = 'none';
          
          const removeBtn = document.createElement('button');
          removeBtn.innerHTML = '×';
          removeBtn.style.position = 'absolute';
          removeBtn.style.top = '0.25rem';
          removeBtn.style.right = '0.25rem';
          removeBtn.style.width = '24px';
          removeBtn.style.height = '24px';
          removeBtn.style.borderRadius = '50%';
          removeBtn.style.border = 'none';
          removeBtn.style.background = '#f56565';
          removeBtn.style.color = 'white';
          removeBtn.style.cursor = 'pointer';
          removeBtn.style.fontSize = '18px';
          removeBtn.style.lineHeight = '1';
          removeBtn.style.display = 'flex';
          removeBtn.style.alignItems = 'center';
          removeBtn.style.justifyContent = 'center';
          
          removeBtn.addEventListener('click', () => {
            container.remove();
            croppedImages.splice(croppedImages.findIndex(c => c.index === index), 1);
          });
          
          // Image loaded, ready for crop
          
          container.appendChild(img);
          container.appendChild(canvas);
          container.appendChild(removeBtn);
          imagePreview.appendChild(container);
          
          // Auto open crop modal when image is clicked
          img.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.style.display = 'flex';
            modal.style.position = 'fixed';
            modal.style.zIndex = '3000';
            modal.style.left = '0';
            modal.style.top = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.background = 'rgba(0,0,0,0.9)';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.flexDirection = 'column';
            modal.style.padding = '1rem';
            
            const cropContainer = document.createElement('div');
            cropContainer.style.position = 'relative';
            cropContainer.style.maxWidth = '90vw';
            cropContainer.style.maxHeight = '80vh';
            cropContainer.style.background = 'white';
            cropContainer.style.borderRadius = '12px';
            cropContainer.style.padding = '1.5rem';
            cropContainer.style.overflow = 'auto';
            
            const cropCanvas = document.createElement('canvas');
            cropCanvas.style.display = 'block';
            cropCanvas.style.maxWidth = '100%';
            cropCanvas.style.border = '2px dashed #667eea';
            cropCanvas.style.borderRadius = '8px';
            
            let isDrawing = false;
            let startX = 0;
            let startY = 0;
            let endX = 0;
            let endY = 0;
            let ctx = cropCanvas.getContext('2d');
            let scale = 1;
            let hasSelection = false;
            
            const sourceImg = new Image();
            sourceImg.onload = () => {
              const maxWidth = Math.min(800, window.innerWidth - 100);
              scale = Math.min(maxWidth / sourceImg.width, 600 / sourceImg.height, 1);
              cropCanvas.width = sourceImg.width * scale;
              cropCanvas.height = sourceImg.height * scale;
              
              ctx.drawImage(sourceImg, 0, 0, cropCanvas.width, cropCanvas.height);
              
              const drawRect = () => {
                ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
                ctx.drawImage(sourceImg, 0, 0, cropCanvas.width, cropCanvas.height);
                
                if (hasSelection || isDrawing) {
                  const x = Math.min(startX, endX);
                  const y = Math.min(startY, endY);
                  const w = Math.abs(endX - startX);
                  const h = Math.abs(endY - startY);
                  
                  if (w > 5 && h > 5) {
                    ctx.strokeStyle = '#667eea';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([]);
                    ctx.strokeRect(x, y, w, h);
                    
                    ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
                    ctx.fillRect(x, y, w, h);
                  }
                }
              };
              
              cropCanvas.addEventListener('mousedown', (e) => {
                const rect = cropCanvas.getBoundingClientRect();
                startX = e.clientX - rect.left;
                startY = e.clientY - rect.top;
                isDrawing = true;
                hasSelection = false;
                endX = startX;
                endY = startY;
              });
              
              cropCanvas.addEventListener('mousemove', (e) => {
                if (!isDrawing) return;
                const rect = cropCanvas.getBoundingClientRect();
                endX = e.clientX - rect.left;
                endY = e.clientY - rect.top;
                hasSelection = Math.abs(endX - startX) > 5 && Math.abs(endY - startY) > 5;
                drawRect();
              });
              
              cropCanvas.addEventListener('mouseup', () => {
                isDrawing = false;
                hasSelection = Math.abs(endX - startX) > 5 && Math.abs(endY - startY) > 5;
              });
              
              cropCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const rect = cropCanvas.getBoundingClientRect();
                const touch = e.touches[0];
                startX = touch.clientX - rect.left;
                startY = touch.clientY - rect.top;
                isDrawing = true;
                hasSelection = false;
                endX = startX;
                endY = startY;
              });
              
              cropCanvas.addEventListener('touchmove', (e) => {
                if (!isDrawing) return;
                e.preventDefault();
                const rect = cropCanvas.getBoundingClientRect();
                const touch = e.touches[0];
                endX = touch.clientX - rect.left;
                endY = touch.clientY - rect.top;
                hasSelection = Math.abs(endX - startX) > 5 && Math.abs(endY - startY) > 5;
                drawRect();
              });
              
              cropCanvas.addEventListener('touchend', () => {
                isDrawing = false;
                hasSelection = Math.abs(endX - startX) > 5 && Math.abs(endY - startY) > 5;
              });
            };
            sourceImg.src = event.target.result;
            
            const buttonsDiv = document.createElement('div');
            buttonsDiv.style.display = 'flex';
            buttonsDiv.style.gap = '1rem';
            buttonsDiv.style.marginTop = '1rem';
            buttonsDiv.style.justifyContent = 'center';
            buttonsDiv.style.flexWrap = 'wrap';
            
            const cropBtn = document.createElement('button');
            cropBtn.textContent = 'Kes';
            cropBtn.className = 'btn btn-primary';
            cropBtn.onclick = () => {
              if (!hasSelection || Math.abs(endX - startX) < 5 || Math.abs(endY - startY) < 5) {
                alert('Lütfen bir alan seçin (fare ile sürükleyerek)');
                return;
              }
              
              const x = Math.min(startX, endX) / scale;
              const y = Math.min(startY, endY) / scale;
              const w = Math.abs(endX - startX) / scale;
              const h = Math.abs(endY - startY) / scale;
              
              const finalCanvas = document.createElement('canvas');
              finalCanvas.width = w;
              finalCanvas.height = h;
              const finalCtx = finalCanvas.getContext('2d');
              
              const imgForCrop = new Image();
              imgForCrop.onload = () => {
                finalCtx.drawImage(imgForCrop, x, y, w, h, 0, 0, w, h);
                finalCanvas.toBlob((blob) => {
                  const existingIndex = croppedImages.findIndex(c => c.index === index);
                  if (existingIndex !== -1) {
                    croppedImages[existingIndex] = { index, blob, dataUrl: finalCanvas.toDataURL() };
                  } else {
                    croppedImages.push({ index, blob, dataUrl: finalCanvas.toDataURL() });
                  }
                  img.src = finalCanvas.toDataURL();
                  modal.remove();
                }, 'image/jpeg', 0.9);
              };
              imgForCrop.src = event.target.result;
            };
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'İptal';
            cancelBtn.className = 'btn btn-outline';
            cancelBtn.onclick = () => {
              modal.remove();
            };
            
            const skipBtn = document.createElement('button');
            skipBtn.textContent = 'Atla (Orijinal)';
            skipBtn.className = 'btn btn-outline';
            skipBtn.onclick = () => {
              const existingIndex = croppedImages.findIndex(c => c.index === index);
              if (existingIndex !== -1) {
                croppedImages[existingIndex] = { index, blob: file, dataUrl: event.target.result };
              } else {
                croppedImages.push({ index, blob: file, dataUrl: event.target.result });
              }
              modal.remove();
            };
            
            buttonsDiv.appendChild(skipBtn);
            buttonsDiv.appendChild(cancelBtn);
            buttonsDiv.appendChild(cropBtn);
            
            cropContainer.appendChild(cropCanvas);
            cropContainer.appendChild(buttonsDiv);
            modal.appendChild(cropContainer);
            document.body.appendChild(modal);
          });
          
          // Auto trigger click to open crop modal
          setTimeout(() => img.click(), 100);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Create product submit
  const productForm = document.getElementById('productForm');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!token || !username) {
        alert('İlan eklemek için giriş yapın.');
        return;
      }
      
      if (croppedImages.length === 0) {
        alert('Lütfen en az bir resim seçin');
        return;
      }
      
      const fd = new FormData();
      fd.append('title', productForm.querySelector('[name="title"]').value);
      fd.append('description', productForm.querySelector('[name="description"]').value);
      fd.append('price', productForm.querySelector('[name="price"]').value);
      fd.append('currency', productForm.querySelector('[name="currency"]').value);
      fd.append('category', productForm.querySelector('[name="category"]').value);
      fd.append('location', productForm.querySelector('[name="location"]').value);
      fd.append('seller', username);
      
      croppedImages.forEach((cropped, idx) => {
        fd.append('images', cropped.blob, `image_${idx}.jpg`);
      });
      
      try {
        const res = await fetch('/api/products', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('fail');
        closeModal();
        productForm.reset();
        imagePreview.innerHTML = '';
        croppedImages.length = 0;
        if (imageInput) imageInput.value = '';
        await loadProducts();
        alert('İlan eklendi.');
      } catch (err) {
        alert('İlan eklenemedi.');
      }
    });
  }
});




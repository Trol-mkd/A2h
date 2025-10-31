document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  const logoutBtn = document.getElementById('logoutBtn');
  const conversationsContainer = document.getElementById('conversationsContainer');
  const messagesList = document.getElementById('messagesList');
  const chatTitle = document.getElementById('chatTitle');
  const messageInputArea = document.getElementById('messageInputArea');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const attachBtn = document.getElementById('attachBtn');
  const fileInput = document.getElementById('fileInput');

  // Mobile menu
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  if (!token || !username) {
    alert('Mesajlar için giriş yapın.');
    location.href = '/login';
    return;
  }

  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    location.href = '/';
  });

  let allMessages = [];
  let currentPeer = null;
  let currentProductId = null;
  let selectedConvItem = null;

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    // Saat formatı: HH:MM
    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    if (minutes < 1) return timeStr;
    if (minutes < 60) return `${timeStr} (${minutes} dk önce)`;
    if (hours < 24) return `${timeStr} (${hours} s önce)`;
    if (days < 7) return `${timeStr} (${days} gün önce)`;
    const dateStr_formatted = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    return `${dateStr_formatted} ${timeStr}`;
  }

  function groupByConversation(messages) {
    const map = new Map();
    messages.forEach(m => {
      const peer = m.sender === username ? m.receiver : m.sender;
      const key = `${peer}|${m.product_id}`;
      if (!map.has(key)) map.set(key, { peer, productId: m.product_id, items: [], unread: 0 });
      map.get(key).items.push(m);
      if (!m.read && m.receiver === username) map.get(key).unread++;
    });
    map.forEach(v => v.items.sort((a,b) => (b.created_at || '').localeCompare(a.created_at || '')));
    return Array.from(map.values()).sort((a,b) => {
      const aLast = a.items[0]?.created_at || '';
      const bLast = b.items[0]?.created_at || '';
      return bLast.localeCompare(aLast);
    });
  }

  function renderConversations() {
    conversationsContainer.innerHTML = '';
    const groups = groupByConversation(allMessages);
    if (groups.length === 0) {
      const storedLang = localStorage.getItem('lang') || 'tr';
      const noMsg = storedLang === 'en' ? 'No messages yet' : storedLang === 'mk' ? 'Сеуште нема пораки' : 'Henüz mesaj yok';
      conversationsContainer.innerHTML = `<p style="padding: 2rem; text-align: center; color: #718096;">${noMsg}</p>`;
      return;
    }
    groups.forEach((g, idx) => {
      const el = document.createElement('div');
      el.className = 'conversation-item';
      if (currentPeer === g.peer && currentProductId === g.productId) {
        el.classList.add('active');
        selectedConvItem = el;
      }
      const last = g.items[0];
      const preview = last.message || (last.file_path ? '📎 Resim' : '');
      const lastTime = new Date(last.created_at);
      const timeStr = lastTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      el.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
          <div class="conversation-name">${g.peer}</div>
          ${g.unread > 0 ? `<span style="background: #667eea; color: white; border-radius: 50%; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold;">${g.unread}</span>` : ''}
        </div>
        <div class="conversation-last-message">${preview.substring(0, 40)}${preview.length > 40 ? '...' : ''}</div>
        <div class="conversation-time">${timeStr}</div>
      `;
      el.addEventListener('click', () => {
        if (selectedConvItem) selectedConvItem.classList.remove('active');
        el.classList.add('active');
        selectedConvItem = el;
        openConversation(g.peer, g.productId);
      });
      conversationsContainer.appendChild(el);
    });
  }

  function renderMessages(peer, productId) {
    messagesList.innerHTML = '';
    const items = allMessages.filter(m => (m.sender === peer || m.receiver === peer) && m.product_id === productId);
    items.sort((a,b) => (a.created_at || '').localeCompare(b.created_at || ''));
    
    if (items.length === 0) {
      const storedLang = localStorage.getItem('lang') || 'tr';
      const empty = storedLang === 'en' ? 'No messages yet' : storedLang === 'mk' ? 'Сеуште нема пораки' : 'Henüz mesaj yok';
      messagesList.innerHTML = `<div class="empty-chat"><div class="empty-chat-icon">💬</div><h3>${empty}</h3></div>`;
      return;
    }

    items.forEach(m => {
      const me = m.sender === username;
      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${me ? 'sent' : 'received'}`;
      
      const hasImage = m.file_path && /\.(png|jpg|jpeg|gif|webp)$/i.test(m.file_path);
      
      bubble.innerHTML = `
        <div class="message-content">
          ${hasImage ? `<div class="message-image-container"><img class="message-image" src="/${String(m.file_path).replace(/^\/?/, '')}" alt="Resim" onclick="this.style.maxWidth='90%'; this.style.cursor='zoom-out';" onmouseout="if(!this.dataset.expanded) { this.style.maxWidth='250px'; this.style.cursor='pointer'; }"></div>` : ''}
          ${m.message ? `<div class="message-text">${m.message}</div>` : ''}
          <div class="message-time">${formatDate(m.created_at)}${me && m.read ? ' ✓✓' : me ? ' ✓' : ''}</div>
        </div>
      `;
      
      // Okundu işaretini güncelle
      if (!m.read && m.receiver === username) {
        fetch(`/api/messages/${m.id}/read`, { method: 'PUT' }).catch(() => {});
      }
      
      messagesList.appendChild(bubble);
    });
    
    setTimeout(() => {
      messagesList.scrollTop = messagesList.scrollHeight;
    }, 100);
  }

  function openConversation(peer, productId) {
    currentPeer = peer;
    currentProductId = productId;
    chatTitle.textContent = `${peer}`;
    messageInputArea.style.display = 'flex';
    renderMessages(peer, productId);
    loadMessages(); // Refresh to mark as read
  }

  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      allMessages = Array.isArray(data) ? data : [];
      renderConversations();
      if (currentPeer && currentProductId) renderMessages(currentPeer, currentProductId);
    } catch (e) {
      const storedLang = localStorage.getItem('lang') || 'tr';
      const error = storedLang === 'en' ? 'Failed to load messages' : storedLang === 'mk' ? 'Не може да се вчитаат пораки' : 'Mesajlar yüklenemedi';
      conversationsContainer.innerHTML = `<p style="padding: 2rem; text-align: center; color: #f56565;">${error}</p>`;
    }
  }

  // Enter tuşu ile mesaj gönder
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  attachBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      const fileName = fileInput.files[0].name;
      messageInput.placeholder = `📎 ${fileName}`;
      setTimeout(() => {
        messageInput.placeholder = '';
      }, 3000);
    }
  });

  sendBtn.addEventListener('click', async () => {
    if (!currentPeer || !currentProductId) return;
    const text = messageInput.value.trim();
    if (!text && !fileInput.files[0]) return;
    
    const fd = new FormData();
    fd.append('sender', username);
    fd.append('receiver', currentPeer);
    fd.append('product_id', String(currentProductId));
    fd.append('message', text || '');
    if (fileInput.files[0]) fd.append('file', fileInput.files[0]);
    
    // Optimistic UI update
    const tempMsg = {
      id: 'temp_' + Date.now(),
      sender: username,
      receiver: currentPeer,
      product_id: currentProductId,
      message: text,
      file_path: null,
      created_at: new Date().toISOString(),
      read: 0
    };
    allMessages.push(tempMsg);
    renderMessages(currentPeer, currentProductId);
    messageInput.value = '';
    fileInput.value = '';
    
    try {
      const res = await fetch('/api/messages', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('send fail');
      await loadMessages();
    } catch (e) {
      allMessages = allMessages.filter(m => m.id !== tempMsg.id);
      renderMessages(currentPeer, currentProductId);
      const storedLang = localStorage.getItem('lang') || 'tr';
      const error = storedLang === 'en' ? 'Failed to send message' : storedLang === 'mk' ? 'Не може да се испрати порака' : 'Mesaj gönderilemedi';
      alert(error);
    }
  });

  // Auto-refresh messages every 5 seconds
  loadMessages();
  setInterval(loadMessages, 5000);
});


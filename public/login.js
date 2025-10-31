document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const body = new URLSearchParams();
    body.append('username', fd.get('username'));
    body.append('password', fd.get('password'));
    try {
      const res = await fetch('/api/login', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Giriş başarısız');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', data.username);
      location.href = '/';
    } catch (err) {
      alert(err.message || 'Giriş başarısız');
    }
  });
});




document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
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
    body.append('email', fd.get('email'));
    body.append('password', fd.get('password'));
    try {
      const res = await fetch('/api/register', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Kayıt başarısız');
      alert('Kayıt başarılı. Giriş sayfasına yönlendiriliyorsunuz.');
      location.href = '/login';
    } catch (err) {
      alert(err.message || 'Kayıt başarısız');
    }
  });
});




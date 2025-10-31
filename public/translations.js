document.addEventListener('DOMContentLoaded', () => {
  const dict = {
    tr: {
      home: 'Ana Sayfa',
      messages: 'Mesajlarım',
      login: 'Giriş Yap',
      register: 'Kayıt Ol',
      logout: 'Çıkış',
      conversations: 'Mesajlarım',
      selectConversation: 'Bir konuşma seçin',
      username: 'Kullanıcı Adı',
      password: 'Şifre',
      email: 'Email',
      passwordMin: 'Şifre (en az 8 karakter)',
      loginTitle: 'Giriş Yap',
      registerTitle: 'Kayıt Ol',
      noAccount: 'Hesabınız yok mu?',
      hasAccount: 'Zaten hesabınız var mı?',
      loginButton: 'Giriş Yap',
      registerButton: 'Kayıt Ol',
      sendMessage: 'Mesaj Gönder',
      typeMessage: 'Mesajınızı yazın...',
      productDetails: 'Ürün Detayları',
      price: 'Fiyat',
      category: 'Kategori',
      location: 'Konum',
      seller: 'Satıcı',
      description: 'Açıklama',
      contactSeller: 'Satıcıya Mesaj Gönder',
      back: 'Geri',
      delete: 'Sil',
      noMessages: 'Henüz mesaj yok',
      loading: 'Yükleniyor...',
      error: 'Hata oluştu'
    },
    en: {
      home: 'Home',
      messages: 'Messages',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      conversations: 'Conversations',
      selectConversation: 'Select a conversation',
      username: 'Username',
      password: 'Password',
      email: 'Email',
      passwordMin: 'Password (min 8 characters)',
      loginTitle: 'Login',
      registerTitle: 'Register',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      loginButton: 'Login',
      registerButton: 'Register',
      sendMessage: 'Send Message',
      typeMessage: 'Type your message...',
      productDetails: 'Product Details',
      price: 'Price',
      category: 'Category',
      location: 'Location',
      seller: 'Seller',
      description: 'Description',
      contactSeller: 'Contact Seller',
      back: 'Back',
      delete: 'Delete',
      noMessages: 'No messages yet',
      loading: 'Loading...',
      error: 'An error occurred'
    },
    mk: {
      home: 'Почетна',
      messages: 'Пораки',
      login: 'Најава',
      register: 'Регистрација',
      logout: 'Одјава',
      conversations: 'Пораки',
      selectConversation: 'Изберете разговор',
      username: 'Корисничко име',
      password: 'Лозинка',
      email: 'Е-пошта',
      passwordMin: 'Лозинка (мин. 8 знаци)',
      loginTitle: 'Најава',
      registerTitle: 'Регистрација',
      noAccount: 'Немате сметка?',
      hasAccount: 'Веќе имате сметка?',
      loginButton: 'Најава',
      registerButton: 'Регистрација',
      sendMessage: 'Испрати порака',
      typeMessage: 'Напишете порака...',
      productDetails: 'Детали за производот',
      price: 'Цена',
      category: 'Категорија',
      location: 'Локација',
      seller: 'Продавач',
      description: 'Опис',
      contactSeller: 'Контактирај го продавачот',
      back: 'Назад',
      delete: 'Избриши',
      noMessages: 'Сеуште нема пораки',
      loading: 'Вчитување...',
      error: 'Настана грешка'
    }
  };

  function applyLanguage(lang) {
    const texts = dict[lang] || dict.tr;
    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      if (texts[key]) {
        if (el.tagName === 'INPUT' && el.type !== 'submit' && el.type !== 'button') {
          el.placeholder = texts[key];
        } else if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
          el.value = texts[key];
        } else {
          el.textContent = texts[key];
        }
      }
    });
    // Select option labels için özel durum
    document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
      const key = el.getAttribute('data-translate-placeholder');
      if (texts[key]) el.placeholder = texts[key];
    });
  }

  const storedLang = localStorage.getItem('lang') || 'tr';
  applyLanguage(storedLang);

  const selects = document.querySelectorAll('#languageSelect');
  selects.forEach(sel => {
    sel.value = storedLang;
    sel.addEventListener('change', () => {
      const lang = sel.value;
      localStorage.setItem('lang', lang);
      applyLanguage(lang);
    });
  });
});




// Shared + page-specific client logic
const $ = (sel) => document.querySelector(sel);

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = 'msg ' + type;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// ---------- Navbar (auth state + mobile menu) ----------
async function initNav() {
  const toggle = $('.menu-toggle');
  const links = $('.nav-links');
  if (toggle) toggle.addEventListener('click', () => links.classList.toggle('open'));

  const authSlot = $('#auth-links');
  if (!authSlot) return;
  try {
    const { user } = await api('/api/me');
    if (user) {
      authSlot.innerHTML =
        `<li class="nav-user">Hi, ${escapeHtml(user.name.split(' ')[0])}</li>` +
        `<li><a href="#" id="logout-link" class="btn-nav">Logout</a></li>`;
      $('#logout-link').addEventListener('click', async (e) => {
        e.preventDefault();
        await api('/api/logout', { method: 'POST' });
        window.location.href = '/';
      });
    } else {
      authSlot.innerHTML =
        `<li><a href="/login.html">Login</a></li>` +
        `<li><a href="/register.html" class="btn-nav">Register</a></li>`;
    }
  } catch (e) {
    console.error(e);
  }
}

// ---------- Register ----------
function initRegister() {
  const form = $('#register-form');
  if (!form) return;
  const msg = $('#msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirm = form.confirm.value;

    if (password !== confirm) return showMsg(msg, 'Passwords do not match.', 'error');
    try {
      await api('/api/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
      showMsg(msg, 'Registration successful! Redirecting...', 'success');
      setTimeout(() => (window.location.href = '/catalogue.html'), 900);
    } catch (err) {
      showMsg(msg, err.message, 'error');
    }
  });
}

// ---------- Login ----------
function initLogin() {
  const form = $('#login-form');
  if (!form) return;
  const msg = $('#msg');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email.value.trim(), password: form.password.value })
      });
      showMsg(msg, 'Login successful! Redirecting...', 'success');
      setTimeout(() => (window.location.href = '/catalogue.html'), 700);
    } catch (err) {
      showMsg(msg, err.message, 'error');
    }
  });
}

// ---------- Catalogue ----------
const COVER_COLORS = ['#7c3aed', '#db2777', '#0891b2', '#ea580c', '#059669', '#4f46e5', '#b45309', '#be123c'];

function initCatalogue() {
  const grid = $('#book-grid');
  if (!grid) return;
  const searchInput = $('#search');
  const categorySelect = $('#category');
  let timer;

  async function loadCategories() {
    const { categories } = await api('/api/categories');
    categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      categorySelect.appendChild(opt);
    });
  }

  async function loadBooks() {
    const params = new URLSearchParams({
      search: searchInput.value.trim(),
      category: categorySelect.value
    });
    try {
      const { books } = await api('/api/books?' + params.toString());
      if (!books.length) {
        grid.innerHTML = '<p class="empty">No books found. Try a different search.</p>';
        return;
      }
      grid.innerHTML = books.map((b) => `
        <article class="book-card">
          <div class="book-cover" style="background:${COVER_COLORS[b.id % COVER_COLORS.length]}">${escapeHtml(b.title)}</div>
          <div class="book-info">
            <span class="tag">${escapeHtml(b.category)}</span>
            <h3>${escapeHtml(b.title)}</h3>
            <span class="author">by ${escapeHtml(b.author)}</span>
            <p class="desc">${escapeHtml(b.description || '')}</p>
            <div class="price-row">
              <span class="price">&#8377;${Number(b.price).toFixed(2)}</span>
              <span class="stock ${b.stock < 15 ? 'low' : ''}">${b.stock} in stock</span>
            </div>
          </div>
        </article>`).join('');
    } catch (err) {
      grid.innerHTML = `<p class="empty">${escapeHtml(err.message)}</p>`;
    }
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(loadBooks, 250);
  });
  categorySelect.addEventListener('change', loadBooks);

  loadCategories().then(loadBooks);
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initRegister();
  initLogin();
  initCatalogue();
});

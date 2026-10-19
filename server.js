require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const { init, getPool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 2 } // 2 hours
  })
);
app.use(express.static(path.join(__dirname, 'public')));

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Auth ----------
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'All fields are required.' });
    if (!emailRegex.test(email))
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const pool = getPool();
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing.length) return res.status(409).json({ error: 'Email is already registered.' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase(), hash]
    );
    req.session.user = { id: result.insertId, name: name.trim(), email: email.toLowerCase() };
    res.status(201).json({ message: 'Registration successful.', user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const [rows] = await getPool().query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password.' });

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ message: 'Login successful.', user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out.' }));
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

// ---------- Catalogue ----------
app.get('/api/books', async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    const params = [];
    let sql = 'SELECT * FROM books WHERE 1=1';
    if (search) {
      sql += ' AND (title LIKE ? OR author LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY title';
    const [books] = await getPool().query(sql, params);
    res.json({ books });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load books.' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await getPool().query('SELECT DISTINCT category FROM books ORDER BY category');
    res.json({ categories: rows.map(r => r.category) });
  } catch (err) {
    res.status(500).json({ error: 'Could not load categories.' });
  }
});

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Bookstore running at http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Database initialisation failed:', err.message);
    console.error('Check that MySQL is running and the credentials in .env are correct.');
    process.exit(1);
  });

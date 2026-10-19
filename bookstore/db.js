require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'bookstore';
const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

let pool;

const SAMPLE_BOOKS = [
  ['The Alchemist', 'Paulo Coelho', 'Fiction', 299, 25, 'A shepherd boy travels in search of treasure and discovers his destiny.'],
  ['Wings of Fire', 'A.P.J. Abdul Kalam', 'Biography', 350, 30, 'The autobiography of India\'s Missile Man and former President.'],
  ['Atomic Habits', 'James Clear', 'Self-Help', 499, 40, 'Tiny changes that deliver remarkable results.'],
  ['The Guide', 'R.K. Narayan', 'Fiction', 275, 18, 'A classic Indian novel about a tour guide turned spiritual teacher.'],
  ['Sapiens', 'Yuval Noah Harari', 'History', 560, 22, 'A brief history of humankind.'],
  ['Clean Code', 'Robert C. Martin', 'Technology', 899, 15, 'A handbook of agile software craftsmanship.'],
  ['The Pragmatic Programmer', 'Andrew Hunt', 'Technology', 950, 12, 'Your journey to mastery in software development.'],
  ['Rich Dad Poor Dad', 'Robert Kiyosaki', 'Finance', 325, 35, 'What the rich teach their kids about money.'],
  ['The Immortals of Meluha', 'Amish Tripathi', 'Mythology', 285, 28, 'First book of the Shiva Trilogy.'],
  ['Ikigai', 'Hector Garcia', 'Self-Help', 399, 33, 'The Japanese secret to a long and happy life.'],
  ['A Brief History of Time', 'Stephen Hawking', 'Science', 450, 20, 'From the Big Bang to black holes.'],
  ['Pride and Prejudice', 'Jane Austen', 'Classics', 199, 45, 'A witty romance of manners in Georgian England.']
];

async function init() {
  const conn = await mysql.createConnection(baseConfig);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.end();

  pool = mysql.createPool({
    ...baseConfig,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      author VARCHAR(150) NOT NULL,
      category VARCHAR(60) NOT NULL,
      price DECIMAL(8,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      description TEXT
    )`);

  const [[{ count }]] = await pool.query('SELECT COUNT(*) AS count FROM books');
  if (count === 0) {
    await pool.query(
      'INSERT INTO books (title, author, category, price, stock, description) VALUES ?',
      [SAMPLE_BOOKS]
    );
    console.log('Seeded sample books.');
  }
  return pool;
}

function getPool() {
  return pool;
}

module.exports = { init, getPool };

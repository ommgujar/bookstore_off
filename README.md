<<<<<<< HEAD
# PageTurner – Online Book Store

Responsive book store built with **Node.js + Express + MySQL**.

Pages: Home, Login, Registration, Catalogue (search + category filter).

## Requirements
- Node.js 18+ (https://nodejs.org)
- MySQL running locally (MySQL Server, XAMPP or WAMP)

## Run from VS Code
1. Open this folder in VS Code (`File > Open Folder`).
2. Open the terminal (`Ctrl + ` `).
3. Edit `.env` and set `DB_PASSWORD` to your MySQL root password (leave blank if none).
4. Install packages and start:

```
npm install
npm start
```

5. Open http://localhost:3000

The database `bookstore`, the `users` and `books` tables and 12 sample books are created automatically on first run (`schema.sql` is for reference only).

## Structure
```
server.js        Express server + REST API
db.js            MySQL connection, table creation, seed data
.env             Database and session settings
public/          Front end (HTML, CSS, JS)
```

## API
- POST /api/register, POST /api/login, POST /api/logout, GET /api/me
- GET /api/books?search=&category=, GET /api/categories

Passwords are hashed with bcrypt; sessions use express-session.
=======
# bookstore_off
this is assignment
>>>>>>> f16fe5f7a6afd3b96eed4c469774d7846647931e

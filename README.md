# Podhigai College — Contact Form Backend Setup Guide

> **October 2026 repair update:** See [backend/README.md](backend/README.md) for authentication, CORS and optional seeding configuration. Run `npm test` from the root for isolated regression checks. See [the repair report](reports/bug-audit-2026-10-11.md) for findings and limitations.

## Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher installed
- A free [MongoDB Atlas](https://cloud.mongodb.com) account

---

## Step 1: Set Up MongoDB Atlas (Free Cloud Database)

1. Go to **https://cloud.mongodb.com** and sign up (free)
2. Click **"Build a Database"** → choose **M0 Free** → select any region → click **Create**
3. **Create a database user:**
   - Go to **Database Access** → **Add New Database User**
   - Set a username and password (e.g., `pcetadmin` / `YourSecurePassword`)
   - Role: **Read and Write to any database** → click **Add User**
4. **Allow network access:**
   - Go to **Network Access** → **Add IP Address**
   - Allow only the backend deployment's outbound IP addresses and any development IPs you need.
5. **Get your connection string:**
   - Go to **Database** → click **Connect** → **Drivers**
   - Copy the connection string (looks like: `mongodb+srv://...`)

---

## Step 2: Configure Environment

Edit the file `backend/.env` and update:

```env
MONGODB_URI=mongodb+srv://pcetadmin:YourSecurePassword@cluster0.xxxxx.mongodb.net/podhigai_contacts?retryWrites=true&w=majority
ADMIN_PASSWORD=your_secure_admin_password
ADMIN_USERNAME=your_admin_username
JWT_SECRET=replace_with_a_long_random_secret
NODE_ENV=development
PORT=3001
```

> ⚠️ **Never share your `.env` file or commit it to GitHub!**

---

## Step 3: Start the Backend Server

Open a terminal in the project folder and run:

```bash
cd backend
node server.js
```

You should see:
```
Podhigai Contact API listening on port 3001
```

---

## Step 4: Open the Website

Run `npm start` in a second terminal at the project root, then open `http://localhost:5500/contact.html`. This server allows public website files only and binds to loopback; do not serve the repository root with an unrestricted static server.

- Fill out the contact form and click **Send Message**
- A green toast notification confirms the message was saved to MongoDB

---

## Step 5: Access the Admin Panel

1. Click the **Admin** button in the contact page navigation (top right)
   — OR open `admin.html` directly in your browser
2. Enter your admin username and password (the values set in `.env`)
3. View all submitted contact messages with name, email, phone and message content

---

## Admin Panel Features

| Feature | Description |
|---|---|
| 📊 Stats | Total messages, unread count, today's count |
| 🔍 Search | Filter messages by name, email, or message content |
| 📖 Mark as read | Use the message checkbox; state changes only after server confirmation |
| 🗑️ Delete | Permanently delete messages with confirmation |
| 📄 Pagination | 50 messages per page in the dashboard |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |
| `POST` | `/api/contact` | Submit contact form |
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/api/admin/messages` | Get all messages |
| `PATCH` | `/api/admin/messages/:id/read` | Mark as read |
| `DELETE` | `/api/admin/messages/:id` | Delete a message |
| `GET` | `/api/admin/stats` | Dashboard statistics |

---

## Running in Development (Auto-restart)

```bash
cd backend
npm run dev   # uses nodemon — auto-restarts on file changes
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| "Cannot reach server" on form submit | Make sure `node server.js` is running in the `backend/` folder |
| "MongoDB connection error" | Double-check `MONGODB_URI` in `.env`, and network access in Atlas |
| Admin login fails | Check `ADMIN_PASSWORD` in `.env` matches what you type |
| "Too many requests" error | Wait 15 minutes (rate limiting) or restart the server |

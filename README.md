# Podhigai College — Contact Form Backend Setup Guide

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
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0) → **Confirm**
5. **Get your connection string:**
   - Go to **Database** → click **Connect** → **Drivers**
   - Copy the connection string (looks like: `mongodb+srv://...`)

---

## Step 2: Configure Environment

Edit the file `backend/.env` and update:

```env
MONGODB_URI=mongodb+srv://pcetadmin:YourSecurePassword@cluster0.xxxxx.mongodb.net/podhigai_contacts?retryWrites=true&w=majority
ADMIN_PASSWORD=your_secure_admin_password
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
✅  MongoDB connected successfully
🚀  Podhigai Contact API
    → http://localhost:3001/api/health
```

---

## Step 4: Open the Website

Open `contact.html` in your browser (or via Live Server in VS Code).

- Fill out the contact form and click **Send Message**
- A green toast notification confirms the message was saved to MongoDB

---

## Step 5: Access the Admin Panel

1. Click the **Admin** button in the contact page navigation (top right)
   — OR open `admin.html` directly in your browser
2. Enter your admin password (the one set in `.env`)
3. View all submitted contact messages with name, email, phone and message content

---

## Admin Panel Features

| Feature | Description |
|---|---|
| 📊 Stats | Total messages, unread count, today's count |
| 🔍 Search | Filter messages by name, email, or message content |
| 📖 Auto-read | Messages are marked as read when viewed |
| 🗑️ Delete | Permanently delete messages with confirmation |
| 📄 Pagination | 20 messages per page |

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

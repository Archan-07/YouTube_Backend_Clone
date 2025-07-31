# 🎬 YouTube Backend Clone

This project is a **backend API clone of YouTube**, built using **Node.js**, **Express**, and **MongoDB**, offering core video platform features such as authentication, video uploads, likes, comments, playlists, and subscriptions.

## 🚀 Features

- ✅ User registration & login with JWT authentication
- 📁 Video upload with thumbnail (Cloudinary integration)
- 📊 Channel stats: views, likes, subscribers, videos
- 👍 Like/Unlike videos
- 💬 Comment on videos
- 📺 Playlist creation, add/remove videos to playlists
- 🔔 Subscribe/Unsubscribe to channels
- 🔒 Protected routes via JWT middleware
- 📄 Aggregated data for dashboards (likes, views, etc.)
- 🗂️ Pagination and filtering for videos and comments

---

## 🧑‍💻 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **Media Storage**: Cloudinary
- **Others**: dotenv, bcrypt, async-handler

---

## 🛠️ Setup Instructions

### 1. Clone the repo

```bash
git clone https://github.com/Archan-07/YouTube_Backend_Clone.git
cd youtube-backend-clone
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a .env file and add the following:
- PORT=8000
- MONGODB_URI=your_mongodb_connection_string
- JWT_SECRET=your_jwt_secret
- CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
- CLOUDINARY_API_KEY=your_cloudinary_api_key
- CLOUDINARY_API_SECRET=your_cloudinary_api_secret

### 4. Start the server
```bash
npm run dev
```

## 🧪 API Endpoints

### Auth
- POST /auth/register
- POST /auth/login
- GET /auth/logout
  
### Videos
- POST /videos/ - Upload video
- GET /videos/ - List videos (with filters)
- GET /videos/:id - Get video details

### Likes
- POST /likes/:videoId - Toggle like

### Comments
- POST /comments/:videoId - Add comment
- GET /comments/:videoId - Get video comments

### Playlists
- POST /playlists - Create playlist
- PUT /playlists/:playlistId/:videoId - Add video
- DELETE /playlists/:playlistId/:videoId - Remove video
- GET /playlists/u/:userId - User’s playlists

### Subscriptions
- POST /subscriptions/c/:channelId - Subscribe/Unsubscribe
- GET /subscriptions/u/:channelId - Get subscribers
- GET /subscriptions/c/:userId - Get user’s subscriptions

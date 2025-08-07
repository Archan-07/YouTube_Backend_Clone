# 🎬 YouTube Backend Clone

This project is a **backend API clone of YouTube**, built with **Node.js** and **Express.js**. It uniquely showcases a **monorepo architecture** that includes two distinct database implementations: one using **MongoDB** (NoSQL) and another using **PostgreSQL** (SQL). It offers core video platform features such as authentication, video uploads, likes, comments, playlists, and subscriptions.

---

## 🚀 Key Features

- **Dual Database Support**: Demonstrates a flexible backend architecture with two distinct database implementations:
  - **NoSQL Backend**: Powered by **MongoDB** and **Mongoose**.
  - **SQL Backend**: Powered by **PostgreSQL** and **Prisma ORM**.
- User registration & login with JWT authentication.
- Video upload with thumbnail (Cloudinary integration for secure and scalable media management).
- Channel statistics: views, likes, subscribers, videos.
- User interaction features: Like/Unlike videos, Comment on videos, Subscribe/Unsubscribe to channels.
- Playlist management: creation, adding/removing videos.
- Protected routes via JWT middleware.
- Aggregated data for dashboards (likes, views, etc.).
- Pagination and filtering for videos and comments.

---

## 🧑‍💻 Tech Stack

- **Backend**: Node.js, Express.js
- **Databases**:
  - **NoSQL**: MongoDB + Mongoose (for object data modeling)
  - **SQL**: PostgreSQL + Prisma (for ORM and database management)
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **Media Storage**: Cloudinary
- **Utilities**:
  - `dotenv`: For managing environment variables.
  - `bcrypt`: For secure password hashing.
  - `async-handler`: For simplified error handling in asynchronous Express routes.

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

* **MongoDB Backend Specific**
  - MONGODB_URI=mongodb://localhost:27017/youtube-clone-mongo # or your Atlas connection string
* **PostgreSQL Backend Specific**
  - DATABASE_URL="postgresql://your_user:your_password@localhost:5432/your_database_name?schema=public"

### 4. Start the server

- MongoDB Backend Specific

```bash
npm run dev:mongo
```

- PostgreSQL Backend Specific

```bash
npm run dev:postgres
```

## 🧪 API Endpoints

Most endpoints require authentication using a JWT (JSON Web Token) in the request header. Endpoints marked with 🔐 Protected require a valid access token.

### 👤 User & Authentication Endpoints (`/api/v1/users`)

- `POST /api/v1/users/register` - Register a new user. ⬆️ File Upload (avatar, coverImage)
- `POST /api/v1/users/login` - User login.
- `POST /api/v1/users/logout` - User logout. 🔐 Protected
- `POST /api/v1/users/refreshToken` - Refresh access token.
- `POST /api/v1/users/changePassword` - Change current user's password. 🔐 Protected
- `GET /api/v1/users/getCurrentUser` - Get current user details. 🔐 Protected
- `PATCH /api/v1/users/updateAccount` - Update current user's account details. 🔐 Protected
- `PATCH /api/v1/users/avatar` - Update current user's avatar. 🔐 Protected, ⬆️ File Upload (avatar)
- `PATCH /api/v1/users/coverImage` - Update current user's cover image. 🔐 Protected, ⬆️ File Upload (coverImage)
- `GET /api/v1/users/c/:username` - Get a channel's profile by username. 🔐 Protected
- `GET /api/v1/users/watchHistory` - Get current user's watch history. 🔐 Protected

### 🎥 Video Endpoints (`/api/v1/videos`)

- `GET /api/v1/videos` - Get all videos (can include filters/pagination). 🔐 Protected
- `POST /api/v1/videos` - Publish a new video. 🔐 Protected, ⬆️ File Upload (videoFile, thumbnail)
- `GET /api/v1/videos/:videoId` - Get video details by ID. 🔐 Protected
- `DELETE /api/v1/videos/:videoId` - Delete a video by ID. 🔐 Protected
- `PATCH /api/v1/videos/:videoId` - Update video details. 🔐 Protected, ⬆️ File Upload (thumbnail)
- `PATCH /api/v1/videos/toggle/publish/:videoId` - Toggle video publish status. 🔐 Protected

### ❤️ Like Endpoints (`/api/v1/likes`)

- `POST /api/v1/likes/toggle/v/:videoId` - Toggle like on a video. 🔐 Protected
- `POST /api/v1/likes/toggle/c/:commentId` - Toggle like on a comment. 🔐 Protected
- `POST /api/v1/likes/toggle/t/:tweetId` - Toggle like on a tweet. 🔐 Protected
- `GET /api/v1/likes/videos` - Get all liked videos of the current user. 🔐 Protected

### 💬 Comment Endpoints (`/api/v1/comments`)

- `GET /api/v1/comments/:videoId` - Get all comments for a specific video. 🔐 Protected
- `POST /api/v1/comments/:videoId` - Add a new comment to a video. 🔐 Protected
- `DELETE /api/v1/comments/c/:commentId` - Delete a comment by ID. 🔐 Protected
- `PATCH /api/v1/comments/c/:commentId` - Update a comment by ID. 🔐 Protected

### ▶️ Playlist Endpoints (`/api/v1/playlists`)

- `POST /api/v1/playlists` - Create a new playlist. 🔐 Protected
- `GET /api/v1/playlists/:playlistId` - Get playlist details by ID. 🔐 Protected
- `PATCH /api/v1/playlists/:playlistId` - Update playlist details. 🔐 Protected
- `DELETE /api/v1/playlists/:playlistId` - Delete a playlist by ID. 🔐 Protected
- `PATCH /api/v1/playlists/add/:videoId/:playlistId` - Add a video to a playlist. 🔐 Protected
- `PATCH /api/v1/playlists/remove/:videoId/:playlistId` - Remove a video from a playlist. 🔐 Protected
- `GET /api/v1/playlists/user/:userId` - Get all playlists created by a specific user. 🔐 Protected

### 🔔 Subscription Endpoints (`/api/v1/subscriptions`)

- `POST /api/v1/subscriptions/c/:channelId` - Toggle subscription to a channel (subscribe/unsubscribe). 🔐 Protected
- `GET /api/v1/subscriptions/u/:channelId` - Get subscribers of a specific channel. 🔐 Protected
- `GET /api/v1/subscriptions/subscribed/:subscriberId` - Get channels subscribed by a specific user. 🔐 Protected

### 🐦 Tweet Endpoints (`/api/v1/tweets`)

- `POST /api/v1/tweets` - Create a new tweet. 🔐 Protected
- `GET /api/v1/tweets/user/:userId` - Get all tweets by a specific user. 🔐 Protected
- `PATCH /api/v1/tweets/:tweetId` - Update a tweet by ID. 🔐 Protected
- `DELETE /api/v1/tweets/:tweetId` - Delete a tweet by ID. 🔐 Protected

### 📊 Dashboard Endpoints (`/api/v1/dashboard`)

- `GET /api/v1/dashboard/stats` - Get channel statistics (e.g., total views, subscribers). 🔐 Protected
- `GET /api/v1/dashboard/videos` - Get all videos uploaded by the channel. 🔐 Protected

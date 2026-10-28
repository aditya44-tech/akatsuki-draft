# Akatsuki's Draft: AI-Enabled Content Sharing Platform (Backend)
### Nodevember 4.0 Hackathon Project

Akatsuki's Draft is a high-performance content creation and publishing backend platform. Writers can register, manage private drafts, publish posts for editorial moderation, and enhance their writing using **Google Gemini AI** while strictly preserving the original draft as a distinct version.

Built with **Node.js**, **Express 5**, **MongoDB / Mongoose**, **JWT (JSON Web Tokens)**, and **Google Gemini 2.5 Flash SDK**.

---

## ☁️ Key Features

1. **Robust Authentication & RBAC**:
   - Secure password hashing with `bcryptjs`.
   - Stateless JWT tokens with role-based access control (`user` and `admin`).
   - Profile verification via `GET /auth/me`.

2. **Full Lifecycle Content & Draft Management**:
   - Create posts as private `draft` or submit as `pending` for review.
   - Author-scoped post updates and deletions (`PATCH /posts/:id`, `DELETE /posts/:id`).
   - Private drafts and author dashboard via `GET /posts/my-posts`.
   - Public feed with filtering and pagination via `GET /posts`.

3. **Admin Moderation & Approval Pipeline**:
   - Dedicated pending review queue: `GET /admin/posts/pending`.
   - Real-time approval: `PATCH /admin/posts/approve/:id` publishes posts to the public feed.
   - Rejection handling: `PATCH /admin/posts/reject/:id`.

4. **Google Gemini AI Content Improvement**:
   - Endpoint: `POST /ai/improve/:postId`.
   - Automatically polishes grammar, vocabulary, markdown headers, and engagement.
   - **Version Preservation**: Preserves the original draft intact and creates a brand new draft with a separate `_id` linked via `originalPostId`.
   - Integrated with `@google/genai` (Gemini 2.5 Flash) with fallback heuristic engine.
   - Supports file/document attachments (PDF, text, images) as per Gemini document processing specs.

5. **Built-in Interactive Web Playground**:
   - Serving an Akatsuki-themed control panel and API tester at `http://localhost:5000`.
   - Live testing console for all 15 endpoints with prefilled curl/JSON payloads.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v24+ / ES Modules)
- **Framework**: Express.js 5
- **Database**: MongoDB Atlas with Mongoose (with automated in-memory MongoDB fallback)
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Security**: JWT (`jsonwebtoken`) & `bcryptjs`
- **File Uploads**: `multer` (Images, PDFs, Markdown, Text stored in `/uploads`)
- **Testing**: Automated native test suite (`npm test`)

---

## 🗄️ Database Schema Design

### 1. User Schema
```json
{
  "name": "String (required, trim)",
  "email": "String (required, unique, lowercase)",
  "password": "String (required, hashed with bcrypt)",
  "role": "admin | user (default: 'user')",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 2. Post Schema
```json
{
  "title": "String (required, trim)",
  "description": "String (trim)",
  "content": "String (required)",
  "image": "String (image URL or upload path)",
  "category": "String (default: 'General')",
  "createdBy": "ObjectId (ref: User, required)",
  "status": "draft | pending | approved | rejected (default: 'draft')",
  "createdAt": "Date (default: Date.now)",
  "originalPostId": "ObjectId (ref: Post, optional - tracks AI draft lineage)",
  "aiImproved": "Boolean (default: false)"
}
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
cd "akatsuki draft"
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` (defaults work out of the box with automatic in-memory fallback):
```ini
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/akatsuki_draft
JWT_SECRET=akatsuki_secret_sharing_key_nodevember_2026
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note**: If a local or remote MongoDB is not running, the application automatically launches an in-memory database (`mongodb-memory-server`) so you can run and test everything immediately without manual DB setup!

### 3. Seed Sample Data (Optional)
Populates demo accounts and sample posts:
```bash
npm run seed
```

Default credentials:
- **Admin**: `admin@akatsuki.dev` / `Admin@123`
- **Author**: `author@akatsuki.dev` / `Author@123`
- **User**: `user@akatsuki.dev` / `User@123`

### 4. Run the Server
```bash
# Production start
npm start

# Development mode with hot-reload
npm run dev
```

Visit the interactive Web UI and API Playground:
👉 **`http://localhost:5000`**

---

## 🧪 Running Automated Tests

Run the test suite covering all 15 endpoints:
```bash
npm test
```

Test Results Summary:
```
✔ [1/15] GET /api/health
✔ [2/15] POST /auth/register (Regular User)
✔ [3/15] POST /auth/register (Admin)
✔ [4/15] POST /auth/login
✔ [5/15] GET /auth/me
✔ [6/15] POST /posts (Create Draft)
✔ [7/15] POST /posts (Create Pending Post)
✔ [8/15] GET /posts/my-posts
✔ [9/15] PATCH /posts/:id (Update own post)
✔ [10/15] POST /ai/improve/:postId (Gemini AI Improvement with draft branching)
✔ [11/15] GET /admin/posts/pending (Admin review queue)
✔ [12/15] PATCH /admin/posts/approve/:id (Admin approve)
✔ [13/15] GET /posts & GET /posts/:id (Public feed verification)
✔ [14/15] PATCH /admin/posts/reject/:id (Admin reject)
✔ [15/15] DELETE /posts/:id (Delete own post)
```

---

## 📡 API Reference

### 🔐 Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Log in and receive JWT token | No |
| `GET` | `/auth/me` | Get currently logged-in user details | Bearer JWT |

#### `POST /auth/register`
**Request Body**:
```json
{
  "name": "Itachi Uchiha",
  "email": "itachi@akatsuki.dev",
  "password": "MangekyoSharingan123",
  "role": "user"
}
```

#### `POST /auth/login`
**Request Body**:
```json
{
  "email": "itachi@akatsuki.dev",
  "password": "MangekyoSharingan123"
}
```

---

### 📝 User — Post Management

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/posts` | Create new post or draft | Bearer JWT |
| `GET` | `/posts` | View all approved posts (Public feed) | No |
| `GET` | `/posts/:id` | View approved post by ID | Optional |
| `GET` | `/posts/my-posts` | View your own posts and drafts | Bearer JWT |
| `PATCH` | `/posts/:id` | Update your own post | Bearer JWT |
| `DELETE` | `/posts/:id` | Delete your own post | Bearer JWT |

#### `POST /posts`
Headers: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "title": "Secrets of the Tsukuyomi",
  "description": "An architectural exploration of illusionary states in UI design.",
  "content": "Designing immersive digital experiences requires absolute control over state transitions and user feedback loops.",
  "category": "Philosophy",
  "status": "draft"
}
```

---

### 🛡️ Admin — Post Approval

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/admin/posts/pending` | View posts awaiting approval | Admin JWT |
| `PATCH` | `/admin/posts/approve/:id` | Approve a post | Admin JWT |
| `PATCH` | `/admin/posts/reject/:id` | Reject a post | Admin JWT |

---

### ✨ AI Integration — Content Improvement

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/ai/improve/:postId` | Enhance content using Gemini AI | Bearer JWT |

**Behavior**:
1. Fetches the target draft by `:postId`.
2. Verifies that the caller owns the draft.
3. Prompts Google Gemini 2.5 Flash to enhance title, description, structure, and readability.
4. **Preserves the original draft untouched**.
5. Creates and returns a **brand new draft** with a new `_id`, linking `originalPostId` to the source draft.

---

## 📚 References & Resources

- **FreeCodeCamp Certificate Curriculum**: [Backend Development and APIs](https://www.freecodecamp.org/learn/back-end-development-and-apis-v9/)
- **Google Gemini API Documentation**: [Document & Multimodal Processing](https://ai.google.dev/gemini-api/docs/document-processing?authuser=1#javascript)
- **Nodevember 4.0 Hackathon**: Akatsuki Coding Club
#   a k a t s u k i - d r a f t  
 
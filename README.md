# Akatsuki's Draft: AI-Enabled Content Sharing Platform (Backend)


Akatsuki's Draft is a high-performance content creation and publishing REST API platform. Users can register securely, manage private drafts, submit content for editorial moderation, and improve their writing using **Google Gemini AI** while strictly preserving the original draft as a distinct version.

Built with **Node.js**, **Express 5**, **MongoDB Atlas**, **JWT (JSON Web Tokens)**, and the **Google Gemini 2.5 Flash SDK**.

---

## ☁️ Architecture & Features

1. **Authentication & RBAC**:
   - Secure password hashing using `bcryptjs`.
   - Stateless JWT authentication with role-based access control (`user` and `admin`).
   - Profile retrieval via `GET /auth/me`.

2. **Content & Draft Lifecycle Management**:
   - Save posts as private `draft` or submit as `pending` for review.
   - Author-scoped updates and deletions (`PATCH /posts/:id`, `DELETE /posts/:id`).
   - Personal dashboard endpoint (`GET /posts/my-posts`) with status filters.
   - Public feed with search and category filters (`GET /posts`).

3. **Admin Moderation & Approval Pipeline**:
   - Pending posts review queue: `GET /admin/posts/pending`.
   - Real-time post approval: `PATCH /admin/posts/approve/:id` (publishes to public feed).
   - Post rejection handling: `PATCH /admin/posts/reject/:id`.

4. **AI Content Improvement (Google Gemini 2.5 Flash)**:
   - Endpoint: `POST /ai/improve/:postId`.
   - Automatically polishes grammar, vocabulary, markdown structure, and engagement.
   - **Draft Version Preservation**: Preserves the original draft intact and generates a brand new draft with a separate `_id` linked via `originalPostId`.
   - Built-in heuristic fallback engine if an API key is not configured.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v24+ / ES Modules)
- **Framework**: Express.js 5
- **Database**: MongoDB Atlas with Mongoose (with automated in-memory fallback)
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Security**: JWT (`jsonwebtoken`) & `bcryptjs`
- **File Uploads**: `multer` (Local disk storage in `/uploads`)
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

## 📡 API Reference

### 🔐 1. Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Log in and receive JWT token | No |
| `GET` | `/auth/me` | Get currently logged-in user details | Bearer `<token>` |

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

### 📝 2. User — Post Management

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/posts` | Create new post or draft | Bearer `<token>` |
| `GET` | `/posts` | View all approved posts (Public feed) | No |
| `GET` | `/posts/:id` | View approved post by ID | Optional |
| `GET` | `/posts/my-posts` | View your own posts and drafts | Bearer `<token>` |
| `PATCH` | `/posts/:id` | Update your own post | Bearer `<token>` |
| `DELETE` | `/posts/:id` | Delete your own post | Bearer `<token>` |

#### `POST /posts`
Headers: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "title": "Secrets of Event-Driven Microservices",
  "description": "An architectural exploration of asynchronous messaging.",
  "content": "Designing scalable backends requires idempotent endpoints and robust message separation.",
  "category": "Technology",
  "status": "draft"
}
```

---

### 🛡️ 3. Admin — Post Approval

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/admin/posts/pending` | View posts awaiting approval | Admin Bearer `<token>` |
| `PATCH` | `/admin/posts/approve/:id` | Approve a post (publishes to public feed) | Admin Bearer `<token>` |
| `PATCH` | `/admin/posts/reject/:id` | Reject a post | Admin Bearer `<token>` |

---

### ✨ 4. AI Integration — Content Improvement

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/ai/improve/:postId` | Enhance content via Gemini AI | Bearer `<token>` |

**Behavior**:
1. Fetches the target post by `:postId`.
2. Verifies that the caller owns the post.
3. Prompts Google Gemini 2.5 Flash to enhance title, description, structure, and readability.
4. **Preserves the original draft intact**.
5. Creates and returns a **brand new draft** with a new `_id`, referencing `originalPostId`.

**Request Body** (optional):
```json
{
  "instruction": "Structure with clear markdown subheadings and optimize vocabulary."
}
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Set your configuration:
```ini
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.vvdxaav.mongodb.net/akatsuki_draft?retryWrites=true&w=majority
JWT_SECRET=akatsuki_secret_sharing_key_nodevember_2026
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Seed Sample Data (Optional)
Populates demo accounts and sample posts in your database:
```bash
npm run seed
```

Default credentials:
- **Admin**: `admin@akatsuki.dev` / `Admin@123` (`role: admin`)
- **Author**: `author@akatsuki.dev` / `Author@123` (`role: user`)
- **User**: `user@akatsuki.dev` / `User@123` (`role: user`)

### 4. Run the Server
```bash
# Start server
npm start

# Development mode with auto-reload
npm run dev
```

Base URL: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

## 🧪 Automated Testing

Run the test suite verifying all 15 endpoints:
```bash
npm test
```

Test Results:
```text
✔ [1/15]  GET /api/health
✔ [2/15]  POST /auth/register (Regular User)
✔ [3/15]  POST /auth/register (Admin)
✔ [4/15]  POST /auth/login
✔ [5/15]  GET /auth/me
✔ [6/15]  POST /posts (Create Draft)
✔ [7/15]  POST /posts (Create Pending Post for Admin Approval)
✔ [8/15]  GET /posts/my-posts (View User Posts & Drafts)
✔ [9/15]  PATCH /posts/:id (Update Own Post)
✔ [10/15] POST /ai/improve/:postId (AI Content Improvement & Draft Branching)
✔ [11/15] GET /admin/posts/pending (Admin Review Queue)
✔ [12/15] PATCH /admin/posts/approve/:id (Admin Approve Post)
✔ [13/15] GET /posts & GET /posts/:id (Public Feed Verification)
✔ [14/15] PATCH /admin/posts/reject/:id (Admin Reject Post)
✔ [15/15] DELETE /posts/:id (Delete Own Post)

======================================================
  ALL 15 ENDPOINT TESTS PASSED WITH 100% SUCCESS!
======================================================
```

---

## 📮 Postman Collection

Import `postman_collection.json` into Postman to instantly test all endpoints with pre-configured requests, bodies, and variables.

---

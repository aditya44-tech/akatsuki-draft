import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

// Route imports
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Middlewares
import { notFound, errorHandler } from './middlewares/error.js';

const app = express();

// Core middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded media files
app.use('/uploads', express.static(path.resolve('uploads')));

// Root API information endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: "Akatsuki's Draft: AI-Enabled Content Sharing Platform (Backend)",
    event: 'Nodevember 4.0',
    status: 'online',
    health: '/api/health',
    endpoints: {
      auth: ['POST /auth/register', 'POST /auth/login', 'GET /auth/me'],
      posts: [
        'POST /posts',
        'GET /posts',
        'GET /posts/:id',
        'GET /posts/my-posts',
        'PATCH /posts/:id',
        'DELETE /posts/:id',
      ],
      admin: [
        'GET /admin/posts/pending',
        'PATCH /admin/posts/approve/:id',
        'PATCH /admin/posts/reject/:id',
      ],
      ai: ['POST /ai/improve/:postId'],
    },
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: "Akatsuki's Draft Backend",
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes exactly matching specification
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);

// Catch-all 404 handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

export default app;

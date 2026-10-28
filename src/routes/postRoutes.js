import express from 'express';
import {
  createPost,
  getAllApprovedPosts,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { verifyToken, optionalAuth } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// View own posts and drafts (Must be placed before /:id)
router.get('/my-posts', verifyToken, getMyPosts);

// Public route to view all approved posts
router.get('/', getAllApprovedPosts);

// Public route to view an approved post by ID (Author/Admin can also preview draft/pending/rejected)
router.get('/:id', optionalAuth, getPostById);

// Protected route to create a new post or draft
router.post('/', verifyToken, upload.single('image'), createPost);

// Protected route to update own post
router.patch('/:id', verifyToken, upload.single('image'), updatePost);

// Protected route to delete own post
router.delete('/:id', verifyToken, deletePost);

export default router;

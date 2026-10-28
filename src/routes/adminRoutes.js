import express from 'express';
import {
  getPendingPosts,
  approvePost,
  rejectPost,
} from '../controllers/adminController.js';
import { verifyToken, requireAdmin } from '../middlewares/auth.js';

const router = express.Router();

// All admin routes require valid JWT and admin role
router.use(verifyToken, requireAdmin);

// View posts awaiting approval
router.get('/posts/pending', getPendingPosts);

// Approve a post
router.patch('/posts/approve/:id', approvePost);

// Reject a post
router.patch('/posts/reject/:id', rejectPost);

export default router;

import express from 'express';
import { improvePostContent } from '../controllers/aiController.js';
import { verifyToken } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

// Improve content using AI (Gemini) and save as new draft under same user
router.post('/improve/:postId', verifyToken, upload.single('file'), improvePostContent);

export default router;

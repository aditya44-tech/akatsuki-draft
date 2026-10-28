import Post from '../models/Post.js';
import { improveContentWithGemini } from '../config/gemini.js';

/**
 * @route   POST /ai/improve/:postId
 * @desc    Improve the content using AI and save it as a new draft with a new ID under the same user, preserving the original draft.
 * @access  Private
 */
export const improvePostContent = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { instruction } = req.body;

    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: `Original post with ID ${postId} not found.`,
      });
    }

    // Verify ownership
    const isOwner = originalPost.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only improve your own post drafts.',
      });
    }

    // Call Gemini AI enhancement (passing optional uploaded file/doc if attached)
    const aiResult = await improveContentWithGemini(originalPost, instruction, req.file);

    // Save as a brand new draft with a new ID under the same user, preserving original draft
    const newDraft = await Post.create({
      title: aiResult.improvedTitle,
      description: aiResult.improvedDescription,
      content: aiResult.improvedContent,
      category: originalPost.category,
      image: req.file ? `/uploads/${req.file.filename}` : originalPost.image,
      status: 'draft',
      createdBy: req.user._id,
      originalPostId: originalPost._id,
      aiImproved: true,
    });

    const populatedNewDraft = await Post.findById(newDraft._id).populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: 'Content improved using AI and saved as a new draft, preserving the original draft.',
      newDraft: populatedNewDraft,
      originalDraft: originalPost,
      aiDetails: {
        provider: aiResult.provider,
        summary: aiResult.improvementSummary,
        ...(aiResult.error ? { warning: aiResult.error } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};

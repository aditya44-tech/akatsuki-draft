import Post from '../models/Post.js';

/**
 * @route   GET /admin/posts/pending
 * @desc    View posts awaiting approval
 * @access  Private (Admin only)
 */
export const getPendingPosts = async (req, res, next) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;

    const query = { status: 'pending' };
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Post.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: posts.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /admin/posts/approve/:id
 * @desc    Approve a pending post
 * @access  Private (Admin only)
 */
export const approvePost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post with ID ${id} not found.`,
      });
    }

    post.status = 'approved';
    await post.save();

    const updatedPost = await Post.findById(id).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post approved successfully and is now publicly visible.',
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /admin/posts/reject/:id
 * @desc    Reject a pending post
 * @access  Private (Admin only)
 */
export const rejectPost = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post with ID ${id} not found.`,
      });
    }

    post.status = 'rejected';
    await post.save();

    const updatedPost = await Post.findById(id).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post rejected.',
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

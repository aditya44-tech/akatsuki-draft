import Post from '../models/Post.js';

/**
 * @route   POST /posts
 * @desc    Create a new post or draft
 * @access  Private
 */
export const createPost = async (req, res, next) => {
  try {
    const { title, description, content, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required to create a post.',
      });
    }

    // Determine status (draft or pending)
    let initialStatus = 'draft';
    if (status && ['draft', 'pending'].includes(status.toLowerCase())) {
      initialStatus = status.toLowerCase();
    }

    // Image can come from uploaded file or string URL in body
    let image = req.body.image || '';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create({
      title: title.trim(),
      description: (description || '').trim(),
      content: content.trim(),
      category: (category || 'General').trim(),
      image,
      status: initialStatus,
      createdBy: req.user._id,
    });

    const populatedPost = await Post.findById(post._id).populate('createdBy', 'name email role');

    res.status(201).json({
      success: true,
      message: initialStatus === 'pending' ? 'Post submitted for admin approval' : 'Draft created successfully',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /posts
 * @desc    View all approved posts (Public feed)
 * @access  Public
 */
export const getAllApprovedPosts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    const query = { status: 'approved' };

    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
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
 * @route   GET /posts/:id
 * @desc    View an approved post by ID (Authors and Admins can also preview unapproved)
 * @access  Public (with optional user context)
 */
export const getPostById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate('createdBy', 'name email role');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post with ID ${id} not found.`,
      });
    }

    // If post is approved, it is public
    if (post.status === 'approved') {
      return res.status(200).json({
        success: true,
        post,
      });
    }

    // If not approved, author or admin can view
    const isAuthor = req.user && post.createdBy && post.createdBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (isAuthor || isAdmin) {
      return res.status(200).json({
        success: true,
        post,
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied: This post is pending approval or saved as a private draft.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /posts/my-posts
 * @desc    View your own posts and drafts
 * @access  Private
 */
export const getMyPosts = async (req, res, next) => {
  try {
    const { status, category } = req.query;

    const filter = { createdBy: req.user._id };

    if (status && ['draft', 'pending', 'approved', 'rejected'].includes(status.toLowerCase())) {
      filter.status = status.toLowerCase();
    }

    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const posts = await Post.find(filter)
      .populate('createdBy', 'name email role')
      .populate('originalPostId', 'title status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /posts/:id
 * @desc    Update your own post
 * @access  Private
 */
export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post with ID ${id} not found.`,
      });
    }

    // Check ownership or admin status
    const isOwner = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only edit your own posts.',
      });
    }

    const { title, description, content, category, status } = req.body;

    if (title !== undefined) post.title = title.trim();
    if (description !== undefined) post.description = description.trim();
    if (content !== undefined) post.content = content.trim();
    if (category !== undefined) post.category = category.trim();

    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      post.image = req.body.image;
    }

    // User can change status between draft and pending, or admin can change status
    if (status) {
      const lowerStatus = status.toLowerCase();
      if (isAdmin) {
        if (['draft', 'pending', 'approved', 'rejected'].includes(lowerStatus)) {
          post.status = lowerStatus;
        }
      } else {
        if (['draft', 'pending'].includes(lowerStatus)) {
          post.status = lowerStatus;
        }
      }
    }

    await post.save();
    const updatedPost = await Post.findById(post._id).populate('createdBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /posts/:id
 * @desc    Delete your own post
 * @access  Private
 */
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post with ID ${id} not found.`,
      });
    }

    const isOwner = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only delete your own posts.',
      });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};

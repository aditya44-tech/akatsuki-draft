import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
    },
    image: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      trim: true,
      default: 'General',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must belong to a user'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid status',
      },
      default: 'draft',
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Optional reference to original draft if generated via AI improvement
    originalPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    aiImproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast queries
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ createdBy: 1, createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;

import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetRole: {
      type: String,
      enum: ['all', 'student', 'faculty'],
      default: 'all'
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    pinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

announcementSchema.index({ targetRole: 1, pinned: -1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);

import mongoose from 'mongoose';

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      default: 'New Academic Discussion',
      trim: true
    },
    contextType: {
      type: String,
      enum: ['general', 'course', 'career', 'quiz_gen'],
      default: 'general'
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    messageCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

aiConversationSchema.index({ user: 1, updatedAt: -1 });

export const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      default: 'Research Conversation',
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ projectId: 1, updatedAt: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;

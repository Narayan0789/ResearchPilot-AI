import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    citationIndex: {
      type: Number,
      required: true, // e.g. 1 for [1] or [1, p. 5]
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Source',
      required: true,
    },
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chunk',
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: null,
    },
    pageNumber: {
      type: Number,
      default: null, // exact PDF page number
    },
    section: {
      type: String,
      default: null,
    },
    passage: {
      type: String,
      required: true, // The exact supporting excerpt
    },
    type: {
      type: String,
      enum: ['pdf', 'url', 'web_search'],
      default: 'pdf',
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: [citationSchema],
    metadata: {
      retrievalCount: { type: Number, default: 0 },
      webSearchUsed: { type: Boolean, default: false },
      latencyMs: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
export default Message;

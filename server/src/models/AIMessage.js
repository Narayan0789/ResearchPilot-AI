import mongoose from 'mongoose';

const aiMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIConversation',
      required: true
    },
    sender: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    sources: [
      {
        title: String,
        chunkId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentChunk' },
        score: Number,
        snippet: String
      }
    ]
  },
  {
    timestamps: true
  }
);

aiMessageSchema.index({ conversation: 1, createdAt: 1 });

export const AIMessage = mongoose.model('AIMessage', aiMessageSchema);

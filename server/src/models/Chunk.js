import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Source',
      required: true,
      index: true,
    },
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
    chunkIndex: {
      type: Number,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    pageNumber: {
      type: Number,
      default: 1, // Preserves exact physical page number for PDFs
    },
    section: {
      type: String,
      default: 'General',
    },
    embedding: {
      type: [Number],
      default: [],
      // Stored vector for local cosine calculation or Atlas vector search
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast project-isolated retrieval and ordering
chunkSchema.index({ projectId: 1, sourceId: 1, chunkIndex: 1 });
chunkSchema.index({ userId: 1, projectId: 1 });
// Text index for keyword search support
chunkSchema.index({ text: 'text' });

export const Chunk = mongoose.model('Chunk', chunkSchema);
export default Chunk;

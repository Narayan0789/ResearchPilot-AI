import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyMaterial',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    tokenCount: {
      type: Number,
      default: 0
    },
    embedding: {
      type: [Number],
      default: []
    },
    terms: {
      type: [String],
      default: []
    },
    metadata: {
      pageNumber: { type: Number, default: 1 },
      heading: { type: String, default: '' },
      sourceFileName: { type: String, default: '' }
    }
  },
  {
    timestamps: true
  }
);

documentChunkSchema.index({ course: 1 });
documentChunkSchema.index({ material: 1 });
documentChunkSchema.index({ terms: 1 });

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);

import mongoose from 'mongoose';

const evidenceSourceSchema = new mongoose.Schema(
  {
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Source',
      default: null,
    },
    title: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'pdf',
    },
    pageNumber: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const researchRunSchema = new mongoose.Schema(
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
    query: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      default: 'running',
      index: true,
    },
    searchMetadata: {
      webSearchUsed: { type: Boolean, default: false },
      webResultsCount: { type: Number, default: 0 },
      retrievedChunksCount: { type: Number, default: 0 },
      validCitationsCount: { type: Number, default: 0 },
      evidenceSources: {
        type: [evidenceSourceSchema],
        default: [],
      },
    },
    usage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      executionTimeMs: { type: Number, default: 0 },
    },
    answer: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

researchRunSchema.index({ projectId: 1, createdAt: -1 });

export const ResearchRun = mongoose.model('ResearchRun', researchRunSchema);
export default ResearchRun;

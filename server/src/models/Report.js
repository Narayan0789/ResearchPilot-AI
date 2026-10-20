import mongoose from 'mongoose';

const sourceUsedSchema = new mongoose.Schema(
  {
    sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
    title: { type: String },
    type: { type: String },
    url: { type: String },
    citationCount: { type: Number, default: 1 },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
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
      trim: true,
    },
    topic: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ['markdown', 'executive_summary', 'structured_analysis'],
      default: 'markdown',
    },
    sourcesUsed: [sourceUsedSchema],
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ projectId: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
export default Report;

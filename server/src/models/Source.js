import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['pdf', 'url', 'web_search'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    url: {
      type: String,
      trim: true,
      default: null,
    },
    fileKey: {
      type: String,
      trim: true,
      default: null,
    },
    fileOriginalName: {
      type: String,
      trim: true,
      default: null,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'indexed', 'failed'],
      default: 'pending',
      index: true,
    },
    contentHash: {
      type: String,
      default: null,
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    retrievalMetadata: {
      totalChunks: { type: Number, default: 0 },
      extractedCharacters: { type: Number, default: 0 },
      detectedLanguage: { type: String, default: 'en' },
      author: { type: String, default: null },
      canonicalUrl: { type: String, default: null },
      publishedDate: { type: String, default: null },
      headers: [{ type: String }],
    },
    errorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

sourceSchema.index({ projectId: 1, status: 1 });
sourceSchema.index({ projectId: 1, contentHash: 1 });

export const Source = mongoose.model('Source', sourceSchema);
export default Source;

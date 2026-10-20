import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      default: 'application/pdf'
    },
    fileSize: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    chunkCount: {
      type: Number,
      default: 0
    },
    isProcessed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

studyMaterialSchema.index({ course: 1, createdAt: -1 });
studyMaterialSchema.index({ uploadedBy: 1 });

export const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

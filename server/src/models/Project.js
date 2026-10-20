import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Project title cannot exceed 200 characters'],
    },
    topic: {
      type: String,
      required: [true, 'Research topic is required'],
      trim: true,
      maxlength: [2000, 'Research topic cannot exceed 2000 characters'],
    },
    researchSettings: {
      chunkSize: {
        type: Number,
        default: 600,
        min: 200,
        max: 2000,
      },
      chunkOverlap: {
        type: Number,
        default: 120,
        min: 0,
        max: 500,
      },
      webSearchEnabled: {
        type: Boolean,
        default: true,
      },
      similarityThreshold: {
        type: Number,
        default: 0.25,
        min: 0,
        max: 1,
      },
      citationDensity: {
        type: String,
        enum: ['compact', 'normal', 'detailed'],
        default: 'normal',
      },
      maxSourcesToRetrieve: {
        type: Number,
        default: 6,
        min: 1,
        max: 20,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user projects efficiently
projectSchema.index({ userId: 1, createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
export default Project;

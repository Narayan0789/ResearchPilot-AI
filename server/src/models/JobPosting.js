import mongoose from 'mongoose';

const jobPostingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    location: {
      type: String,
      default: 'On-site / Hybrid',
      trim: true
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Internship', 'Contract', 'Part-time'],
      default: 'Full-time'
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    preferredSkills: {
      type: [String],
      default: []
    },
    minCgpa: {
      type: Number,
      default: 6.0,
      min: 0,
      max: 10
    },
    salaryRange: {
      type: String,
      default: 'Competitive',
      trim: true
    },
    deadline: {
      type: Date
    },
    applyUrl: {
      type: String,
      default: '',
      trim: true
    },
    applicants: [
      {
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        appliedAt: { type: Date, default: Date.now },
        resumeUrl: String
      }
    ],
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    source: {
      type: String,
      enum: ['campus', 'live_feed'],
      default: 'campus'
    },
    externalId: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

jobPostingSchema.index({ active: 1, createdAt: -1 });

export const JobPosting = mongoose.model('JobPosting', jobPostingSchema);

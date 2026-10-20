import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    resumeFileName: {
      type: String,
      default: ''
    },
    parsedSkills: {
      type: [String],
      default: []
    },
    overallScore: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    },
    matchedJobs: [
      {
        job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting' },
        matchPercentage: Number,
        matchedSkills: [String],
        missingSkills: [String],
        recommendations: [String]
      }
    ],
    formattingFeedback: {
      type: [String],
      default: []
    },
    suggestedBulletPoints: {
      type: [String],
      default: []
    },
    recommendedInterviewQuestions: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

resumeAnalysisSchema.index({ student: 1, createdAt: -1 });

export const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

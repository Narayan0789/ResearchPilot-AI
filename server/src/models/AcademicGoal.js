import mongoose from 'mongoose';

const academicGoalSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    semester: {
      type: Number,
      required: true
    },
    targetGpa: {
      type: Number,
      required: true,
      min: 1.0,
      max: 10.0
    },
    studyHoursPerWeek: {
      type: Number,
      default: 15
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    milestones: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false }
      }
    ],
    progressPercentage: {
      type: Number,
      default: 0
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

academicGoalSchema.index({ student: 1, semester: 1 });

export const AcademicGoal = mongoose.model('AcademicGoal', academicGoalSchema);

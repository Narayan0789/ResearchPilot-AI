import mongoose from 'mongoose';

const attemptAnswerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true
  },
  selectedOptionIndex: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  marksAwarded: {
    type: Number,
    default: 0
  }
});

const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    answers: [attemptAnswerSchema],
    score: {
      type: Number,
      default: 0
    },
    totalMarks: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    },
    passed: {
      type: Boolean,
      default: false
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    submittedAt: {
      type: Date
    },
    timeTakenSeconds: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

assessmentAttemptSchema.index({ assessment: 1, student: 1 }, { unique: true });
assessmentAttemptSchema.index({ student: 1, course: 1 });

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

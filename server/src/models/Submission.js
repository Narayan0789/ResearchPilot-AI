import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
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
    submissionText: {
      type: String,
      default: '',
      trim: true
    },
    fileUrl: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: ''
    },
    fileSize: {
      type: Number,
      default: 0
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    isLate: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'resubmission_requested'],
      default: 'submitted'
    },
    marksObtained: {
      type: Number,
      min: 0
    },
    feedback: {
      type: String,
      default: '',
      trim: true
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gradedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ course: 1, student: 1 });
submissionSchema.index({ student: 1, status: 1 });

export const Submission = mongoose.model('Submission', submissionSchema);

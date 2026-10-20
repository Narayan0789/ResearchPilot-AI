import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
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
    semester: {
      type: Number,
      required: true
    },
    academicYear: {
      type: String,
      default: '2025-2026',
      trim: true
    },
    status: {
      type: String,
      enum: ['enrolled', 'dropped', 'completed'],
      default: 'enrolled'
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

enrollmentSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });
enrollmentSchema.index({ course: 1, status: 1 });
enrollmentSchema.index({ student: 1, status: 1 });

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

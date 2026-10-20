import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema(
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
      default: '2025-2026'
    },
    internalMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 30
    },
    assignmentMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 20
    },
    assessmentMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 20
    },
    endSemMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 30
    },
    totalMarks: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    letterGrade: {
      type: String,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'],
      default: 'P'
    },
    gpaPoints: {
      type: Number,
      default: 6.0,
      min: 0,
      max: 10
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

gradeSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });
gradeSchema.index({ course: 1 });
gradeSchema.index({ student: 1 });

export const Grade = mongoose.model('Grade', gradeSchema);

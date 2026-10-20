import mongoose from 'mongoose';

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    studentId: {
      type: String,
      required: [true, 'Student ID or Enrollment Number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    degree: {
      type: String,
      required: [true, 'Degree / Course is required'],
      trim: true
    },
    semester: {
      type: Number,
      required: [true, 'Current semester is required'],
      min: 1,
      max: 12
    },
    academicYear: {
      type: String,
      default: '2025-2026',
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    skills: {
      type: [String],
      default: []
    },
    careerInterests: {
      type: [String],
      default: []
    },
    cgpa: {
      type: Number,
      default: 0.0,
      min: 0.0,
      max: 10.0
    },
    totalCredits: {
      type: Number,
      default: 0
    },
    academicRiskScore: {
      type: Number,
      default: 15,
      min: 0,
      max: 100
    },
    academicRiskLevel: {
      type: String,
      enum: ['Low', 'Moderate', 'High'],
      default: 'Low'
    },
    riskFactors: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

studentProfileSchema.index({ department: 1, semester: 1 });

export const StudentProfile = mongoose.model('StudentProfile', studentProfileSchema);

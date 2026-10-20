import mongoose from 'mongoose';

const facultyProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    facultyId: {
      type: String,
      required: [true, 'Faculty / Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    officeHours: {
      type: String,
      default: 'Mon-Fri 2:00 PM - 4:00 PM',
      trim: true
    },
    qualifications: {
      type: [String],
      default: []
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

facultyProfileSchema.index({ department: 1, approvalStatus: 1 });

export const FacultyProfile = mongoose.model('FacultyProfile', facultyProfileSchema);

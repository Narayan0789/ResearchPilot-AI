import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'excused'],
      default: 'present',
      required: true
    },
    remarks: {
      type: String,
      default: '',
      trim: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate attendance records for the same student and session
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceRecordSchema.index({ student: 1, course: 1, status: 1 });
attendanceRecordSchema.index({ course: 1, createdAt: -1 });

export const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);

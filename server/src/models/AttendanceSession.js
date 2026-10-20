import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    topic: {
      type: String,
      default: '',
      trim: true
    },
    semester: {
      type: Number
    },
    academicYear: {
      type: String,
      default: '2025-2026'
    },
    sessionType: {
      type: String,
      enum: ['lecture', 'lab', 'tutorial'],
      default: 'lecture'
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    presentCount: {
      type: Number,
      default: 0
    },
    absentCount: {
      type: Number,
      default: 0
    },
    excusedCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

attendanceSessionSchema.index({ course: 1, date: -1 });
attendanceSessionSchema.index({ faculty: 1 });

export const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);

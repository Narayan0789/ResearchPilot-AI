import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 12
    },
    credits: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    syllabus: {
      type: String,
      default: '',
      trim: true
    },
    faculty: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    schedule: [
      {
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
        startTime: String,
        endTime: String,
        room: String
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

courseSchema.index({ department: 1, semester: 1 });
courseSchema.index({ faculty: 1 });

export const Course = mongoose.model('Course', courseSchema);

import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileSize: Number
      }
    ],
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 100,
      min: 1
    },
    allowLateSubmissions: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

assignmentSchema.index({ course: 1, dueDate: 1 });
assignmentSchema.index({ faculty: 1 });

export const Assignment = mongoose.model('Assignment', assignmentSchema);

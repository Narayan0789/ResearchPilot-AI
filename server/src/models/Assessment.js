import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: [val => val.length >= 2, 'At least 2 options required']
  },
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0
  },
  marks: {
    type: Number,
    default: 1,
    min: 1
  },
  explanation: {
    type: String,
    default: '',
    trim: true
  }
});

const assessmentSchema = new mongoose.Schema(
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
      required: [true, 'Assessment title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
      max: 240
    },
    totalMarks: {
      type: Number,
      default: 100
    },
    passingMarks: {
      type: Number,
      default: 40
    },
    questions: {
      type: [questionSchema],
      validate: [val => val.length > 0, 'At least one question is required']
    },
    publishStatus: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft'
    },
    releaseDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

assessmentSchema.index({ course: 1, publishStatus: 1 });
assessmentSchema.index({ faculty: 1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);

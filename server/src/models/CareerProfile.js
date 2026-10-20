import mongoose from 'mongoose';

const careerProfileSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    resumeUrl: {
      type: String,
      default: ''
    },
    resumeFileName: {
      type: String,
      default: ''
    },
    resumeRawText: {
      type: String,
      default: ''
    },
    extractedSkills: {
      type: [String],
      default: []
    },
    targetRoles: {
      type: [String],
      default: ['Software Engineer', 'Full Stack Developer']
    },
    education: [
      {
        degree: String,
        institution: String,
        year: String,
        grade: String
      }
    ],
    projects: [
      {
        title: String,
        description: String,
        technologies: [String],
        link: String
      }
    ],
    experience: [
      {
        company: String,
        role: String,
        duration: String,
        summary: String
      }
    ],
    linkedinUrl: {
      type: String,
      default: ''
    },
    githubUrl: {
      type: String,
      default: ''
    },
    mockInterviewHistory: [
      {
        date: { type: Date, default: Date.now },
        role: String,
        overallScore: Number,
        feedback: String,
        questionsAnswered: Number
      }
    ]
  },
  {
    timestamps: true
  }
);

export const CareerProfile = mongoose.model('CareerProfile', careerProfileSchema);

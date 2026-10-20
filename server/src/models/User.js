import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: function () {
        // Only required if not signed in with Google
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      sparse: true,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    preferences: {
      theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
      defaultCitationDensity: { type: String, enum: ['compact', 'normal', 'detailed'], default: 'normal' },
      autoWebSearch: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(enteredPassword, this.passwordHash);
};

// Static helper to hash passwords
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

// Transform to remove sensitive fields when converting to JSON
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
export default User;

import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { Conversation } from '../models/Conversation.js';
import logger from '../utils/logger.js';

const COOKIE_NAME = 'token';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Signs a JWT and sets a secure HTTP-only cookie.
 */
function sendTokenCookie(user, statusCode, res) {
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET || 'researchpilot_dev_secret',
    { expiresIn: JWT_EXPIRES_IN }
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  };

  res.cookie(COOKIE_NAME, token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token, // Provided for optional header-based auth/testing
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      preferences: user.preferences,
      createdAt: user.createdAt,
    },
  });
}

/**
 * Register a new user with email and password
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
    });

    // Auto-create initial project so the user lands on an active research dashboard
    try {
      const defaultProject = await Project.create({
        userId: user._id,
        title: 'My Research Workspace',
        topic: 'General research, scientific inquiries, and document synthesis',
      });
      await Conversation.create({
        projectId: defaultProject._id,
        userId: user._id,
        title: 'General Inquiries',
      });
    } catch (projErr) {
      logger.warn(`Could not create default project for user ${user._id}: ${projErr.message}`);
    }

    logger.info(`User registered successfully: ${user.email} (${user._id})`);
    sendTokenCookie(user, 201, res);
  } catch (error) {
    next(error);
  }
}

/**
 * Login existing user
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Check if user registered via Google only
    if (!user.passwordHash && user.googleId) {
      return res.status(400).json({
        success: false,
        error: 'This account was created with Google Sign-In. Please sign in with Google.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    logger.info(`User logged in: ${user.email}`);
    sendTokenCookie(user, 200, res);
  } catch (error) {
    next(error);
  }
}

/**
 * Google Sign-in / Sign-up handler
 * Accepts Google token or demo profile payload
 */
export async function googleAuth(req, res, next) {
  try {
    const { email, name, avatar, googleId, credential } = req.body;

    let targetEmail = email;
    let targetName = name;
    let targetAvatar = avatar;
    let targetGoogleId = googleId;

    // Decode Google JWT credential if provided
    if (credential) {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
          targetEmail = payload.email;
          targetName = payload.name;
          targetAvatar = payload.picture;
          targetGoogleId = payload.sub;
        }
      } catch (decodeErr) {
        logger.warn(`Could not decode Google credential JWT: ${decodeErr.message}`);
      }
    }

    if (!targetEmail) {
      // Provide a friendly demo Google user for development if invoked directly
      targetEmail = 'google.researcher@example.com';
      targetName = targetName || 'Dr. Alex Vance (Google)';
      targetGoogleId = targetGoogleId || 'goog_demo_987654321';
    }

    targetEmail = targetEmail.toLowerCase();

    let user = await User.findOne({
      $or: [{ email: targetEmail }, { googleId: targetGoogleId }],
    });

    if (user) {
      // Update Google credentials if missing
      if (!user.googleId && targetGoogleId) {
        user.googleId = targetGoogleId;
      }
      if (!user.avatar && targetAvatar) {
        user.avatar = targetAvatar;
      }
      await user.save();
    } else {
      user = await User.create({
        name: targetName || 'Researcher',
        email: targetEmail,
        googleId: targetGoogleId || `goog_${Date.now()}`,
        avatar: targetAvatar || null,
      });
      logger.info(`Created new user via Google Sign-In: ${user.email}`);

      // Auto-create initial project so Google users land on an active research dashboard
      try {
        const defaultProject = await Project.create({
          userId: user._id,
          title: 'My Research Workspace',
          topic: 'General research, scientific inquiries, and document synthesis',
        });
        await Conversation.create({
          projectId: defaultProject._id,
          userId: user._id,
          title: 'General Inquiries',
        });
      } catch (projErr) {
        logger.warn(`Could not create default project for Google user ${user._id}: ${projErr.message}`);
      }
    }

    sendTokenCookie(user, 200, res);
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 */
export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    path: '/',
  });
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

/**
 * Get currently authenticated user profile
 */
export async function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      preferences: req.user.preferences,
      createdAt: req.user.createdAt,
    },
  });
}

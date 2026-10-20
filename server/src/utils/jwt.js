import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
}

export function sendTokenResponse(user, statusCode, res, message = 'Success') {
  const token = generateToken(user);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax'
  };

  const sanitizedUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    avatar: user.avatar,
    notificationPreferences: user.notificationPreferences
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: sanitizedUser
    });
}

export function clearTokenCookie(res) {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax'
  });
}

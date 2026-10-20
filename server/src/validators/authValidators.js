import { body, validationResult } from 'express-validator';
import { sendError } from '../utils/apiResponse.js';

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => `${err.path || err.param}: ${err.msg}`);
    return sendError(res, 'Validation error', 400, extractedErrors);
  }
  next();
}

export const validateStudentRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid college email address')
    .normalizeEmail(),
  body('studentId')
    .trim()
    .notEmpty()
    .withMessage('Student ID or Enrollment Number is required'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  body('degree')
    .trim()
    .notEmpty()
    .withMessage('Degree or course is required'),
  body('semester')
    .isInt({ min: 1, max: 12 })
    .withMessage('Semester must be an integer between 1 and 12'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  body('termsAccepted')
    .custom((val) => {
      if (val !== true && val !== 'true') {
        throw new Error('You must accept the terms and privacy conditions');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateFacultyRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid official college email address')
    .normalizeEmail(),
  body('facultyId')
    .trim()
    .notEmpty()
    .withMessage('Faculty / Employee ID is required'),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required'),
  body('designation')
    .trim()
    .notEmpty()
    .withMessage('Designation is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

export const validateForgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  handleValidationErrors
];

export const validateResetPassword = [
  body().custom((value, { req }) => {
    const code = req.body.otp || req.body.token;
    if (!code || !code.toString().trim()) {
      throw new Error('6-digit OTP code or reset token is required');
    }
    return true;
  }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidationErrors
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number'),
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New password confirmation does not match');
      }
      return true;
    }),
  handleValidationErrors
];

import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  credential: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  googleId: z.string().optional(),
});

export const createProjectSchema = z.object({
  title: z.string().min(2, 'Project title must be at least 2 characters').max(200),
  topic: z.string().min(5, 'Research topic must be at least 5 characters').max(2000),
  researchSettings: z
    .object({
      chunkSize: z.number().min(200).max(2000).optional(),
      chunkOverlap: z.number().min(0).max(500).optional(),
      webSearchEnabled: z.boolean().optional(),
      similarityThreshold: z.number().min(0).max(1).optional(),
      citationDensity: z.enum(['compact', 'normal', 'detailed']).optional(),
      maxSourcesToRetrieve: z.number().min(1).max(20).optional(),
    })
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const ingestUrlSchema = z.object({
  url: z.string().url('A valid URL is required (e.g. https://example.com/article)'),
  title: z.string().max(300).optional(),
});

export const researchQuerySchema = z.object({
  query: z.string().min(3, 'Research query must be at least 3 characters').max(2000),
  enableWebSearch: z.boolean().optional(),
});

export const chatMessageSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(4000),
  enableWebSearch: z.boolean().optional(),
});

export const createReportSchema = z.object({
  title: z.string().min(3, 'Report title must be at least 3 characters').max(250),
  topic: z.string().min(5, 'Topic description is required').max(2000),
  format: z.enum(['markdown', 'executive_summary', 'structured_analysis']).default('markdown'),
  sourceIds: z.array(z.string()).optional(),
});

/**
 * Middleware wrapper for Zod validation schemas
 */
export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

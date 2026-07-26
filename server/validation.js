import { z } from 'zod';

const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(24, 'Username must be at most 24 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);

export const registerSchema = z.object({ username, email, password }).strict();
export const loginSchema = z.object({ email, password }).strict();
export const profileSchema = z.object({
  bio: z.string().trim().max(240, 'Biography cannot exceed 240 characters'),
  avatarUrl: z.union([
    z.literal(''),
    z.string().trim().url('Enter a valid profile picture URL').max(1000),
  ]).optional(),
}).strict().transform((data) => ({ ...data, avatarUrl: data.avatarUrl || null }));
const statement = z.string().trim().min(1, 'A forekast cannot be empty').max(280, 'A forekast cannot exceed 280 characters');

export const forecastSchema = z
  .object({
    statement: statement.optional(),
    content: statement.optional(),
    reasoning: z.string().trim().max(2000, 'Reasoning cannot exceed 2,000 characters').optional(),
    category: z
      .enum(['TECHNOLOGY', 'BUSINESS', 'SCIENCE', 'POLITICS', 'SPORTS', 'CULTURE', 'OTHER'])
      .default('OTHER'),
    targetDate: z.coerce.date().min(new Date(), 'Target date must be in the future').optional(),
  })
  .strict()
  .refine((data) => data.statement || data.content, {
    message: 'A forekast statement is required',
    path: ['statement'],
  })
  .transform((data) => ({
    statement: data.statement || data.content,
    reasoning: data.reasoning || null,
    category: data.category,
    targetDate: data.targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }));

export const resolutionSchema = z.object({
  result: z.enum(['CORRECT', 'INCORRECT', 'INCONCLUSIVE']),
  explanation: z.string().trim().min(10, 'Explain the outcome in at least 10 characters').max(2000),
  sourceUrl: z.union([z.literal(''), z.string().trim().url('Enter a valid evidence URL')]).optional(),
}).strict().transform((data) => ({ ...data, sourceUrl: data.sourceUrl || null }));

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    req.validatedBody = result.data;
    next();
  };
}

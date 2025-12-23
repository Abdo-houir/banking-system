import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' })
    .transform((email) => email.toLowerCase().trim()),

  password: z
    .string()
    .min(1, { message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters' }),
});

// Register validation schema
export const registerSchema = z.object({
  email: z
    .email({ message: 'Please enter a valid email address' })
    .min(1, { message: 'Email is required' })
    .transform((email) => email.toLowerCase().trim()),

  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),

  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'First name can only contain letters and spaces' }),

  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'Last name can only contain letters and spaces' }),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Please enter a valid phone number' })
    .optional()
    .or(z.literal('')),
});

// Profile update validation schema
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'First name can only contain letters and spaces' })
    .optional(),

  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name cannot exceed 50 characters' })
    .regex(/^[a-zA-Z\s]*$/, { message: 'Last name can only contain letters and spaces' })
    .optional(),

  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Please enter a valid phone number' })
    .optional()
    .or(z.literal('')),
});

// Password change validation schema
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: 'Current password is required' }),

  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),

  confirmPassword: z
    .string()
    .min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type definitions
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Utility function to format Zod errors
export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}
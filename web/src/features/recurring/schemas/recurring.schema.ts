import { z } from 'zod';

export const recurringExpenseSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
    description: z.string().optional(),
    amount: z.string().min(1, 'Amount is required'),
    gstAmount: z.string().optional(),
    bizPercent: z
      .number()
      .int()
      .min(0, 'Business % must be at least 0')
      .max(100, 'Business % must be at most 100'),
    providerId: z.string().uuid('Invalid provider'),
    categoryId: z.string().uuid('Invalid category'),
    schedule: z.enum(['monthly', 'quarterly', 'yearly'], {
      required_error: 'Schedule is required',
    }),
    dayOfMonth: z
      .number()
      .int()
      .min(1, 'Day must be at least 1')
      .max(28, 'Day must be 1-28 to avoid month-end issues'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
      .optional()
      .or(z.literal('')),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (!data.endDate || data.endDate === '') return true;
      return data.endDate > data.startDate;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    },
  );

export type RecurringExpenseFormValues = z.infer<typeof recurringExpenseSchema>;

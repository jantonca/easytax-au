import { z } from 'zod';

export const expenseFormSchema = z.object({
  date: z
    .string()
    .nonempty('Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  amount: z.string().nonempty('Amount is required'),
  gstAmount: z.string().optional(),
  bizPercent: z
    .number({ invalid_type_error: 'Business use % must be a number' })
    .int('Business use % must be an integer')
    .min(0, 'Business use % must be at least 0')
    .max(100, 'Business use % cannot exceed 100'),
  providerId: z.string().uuid('Provider is required'),
  categoryId: z.string().uuid('Category is required'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  fileRef: z.string().max(255, 'File reference must be 255 characters or less').optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

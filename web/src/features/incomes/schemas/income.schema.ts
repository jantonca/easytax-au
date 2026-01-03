import { z } from 'zod';

export const incomeFormSchema = z.object({
  date: z
    .string()
    .nonempty('Date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  clientId: z.string().uuid('Client is required'),
  invoiceNum: z.string().max(50, 'Invoice number must be 50 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  subtotal: z.string().nonempty('Subtotal is required'),
  gst: z.string().nonempty('GST is required'),
  isPaid: z.boolean().optional(),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

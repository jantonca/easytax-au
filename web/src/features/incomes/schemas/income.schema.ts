import { z } from 'zod';

export const incomeFormSchema = z
  .object({
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
    /**
     * Payment state of the record BEFORE this edit (never rendered).
     * The receipt-date requirement applies only to newly marking an income
     * paid; an already-paid legacy record keeps its unknown state.
     */
    wasPaid: z.boolean().optional(),
    /** Date the payment was received (YYYY-MM-DD). Required when newly marking paid. */
    paymentDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Receipt date must be in YYYY-MM-DD format')
      .or(z.literal(''))
      .optional(),
  })
  .superRefine((values, ctx) => {
    // Newly marking an income paid requires an explicit receipt date
    // (cash-basis BAS attributes income to the payment period). An already
    // paid record may keep its "receipt date unknown" state.
    const newlyPaid = (values.isPaid ?? false) && !values.wasPaid;
    if (newlyPaid && !values.paymentDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['paymentDate'],
        message: 'Receipt date is required when marking as paid',
      });
    }
  });

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;

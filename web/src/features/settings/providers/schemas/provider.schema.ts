import { z } from 'zod';

export const providerFormSchema = z.object({
  name: z.string().min(1, 'Provider name is required').max(255, 'Name must be 255 characters or less'),
  isInternational: z.boolean().default(false),
  defaultCategoryId: z.string().uuid('Invalid category').optional().or(z.literal('')),
  abnArn: z
    .string()
    .regex(/^\d{9}$|^\d{11}$/, 'Must be 9 (ARN) or 11 (ABN) digits')
    .optional()
    .or(z.literal('')),
});

export type ProviderFormValues = z.infer<typeof providerFormSchema>;

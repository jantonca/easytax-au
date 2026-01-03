import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(255, 'Name must be 255 characters or less'),
  basLabel: z.string().regex(/^(1B|G10|G11)$/, 'Must be a valid BAS label (1B, G10, G11)'),
  isDeductible: z.boolean().default(true),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().or(z.literal('')),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

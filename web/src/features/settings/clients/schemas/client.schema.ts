import { z } from 'zod';

export const clientFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Client name is required')
    .max(255, 'Name must be 255 characters or less'),
  abn: z
    .string()
    .regex(/^\d{11}$/, 'ABN must be 11 digits')
    .optional()
    .or(z.literal('')),
  isPsiEligible: z.boolean().default(false),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

import { z } from "zod";

export const createCompanySchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  address: z
    .string()
    .max(200, "Address must be less than 200 characters")
    .optional(),
  phone: z
    .string()
    .max(20, "Phone must be less than 20 characters")
    .regex(/^[\d\s\-+()]*$/, "Invalid phone number format")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  isActive: z.boolean().default(true),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().min(1, "Company ID is required"),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

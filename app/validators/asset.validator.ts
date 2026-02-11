import { z } from "zod";

const assetBaseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  serialNumber: z.string().max(100, "Serial number must be less than 100 characters").optional(),
  model: z.string().max(100, "Model must be less than 100 characters").optional(),
  manufacturer: z.string().max(100, "Manufacturer must be less than 100 characters").optional(),
  purchaseDate: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  purchasePrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || val >= 0, "Price must be positive"),
  currentValue: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || val >= 0, "Value must be positive"),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
  status: z.enum(["AVAILABLE", "ASSIGNED", "UNDER_MAINTENANCE", "RETIRED"]).default("AVAILABLE"),
  category: z.string().max(50, "Category must be less than 50 characters").optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((t) => t.trim()).filter(Boolean) : [])),
  companyId: z.string().min(1, "Company is required"),
  imageUrl: z.string().optional(),
  ownershipType: z.enum(["COMPANY", "PRIVATE", "OTHER"]).default("COMPANY"),
  ownerId: z.string().optional(),
  otherOwnership: z.string().max(200, "Ownership details must be less than 200 characters").optional(),
});

const ownershipRefinement = (data: any, ctx: z.RefinementCtx) => {
  if (data.ownershipType === "PRIVATE" && !data.ownerId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Owner is required for private assets",
      path: ["ownerId"],
    });
  }
  if (data.ownershipType === "OTHER" && !data.otherOwnership) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Ownership details are required for 'Other' type",
      path: ["otherOwnership"],
    });
  }
};

export const createAssetSchema = assetBaseSchema.superRefine(ownershipRefinement);

export const updateAssetSchema = assetBaseSchema
  .partial()
  .extend({
    id: z.string().min(1, "Asset ID is required"),
  })
  .superRefine(ownershipRefinement);

export const assignAssetSchema = z.object({
  assetId: z.string().min(1, "Asset is required"),
  userId: z.string().min(1, "User is required"),
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export const returnAssetSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export const transferAssetSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  newUserId: z.string().min(1, "New user is required"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
export type TransferAssetInput = z.infer<typeof transferAssetSchema>;

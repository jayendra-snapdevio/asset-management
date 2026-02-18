/**
 * Consolidated schema exports for form validation.
 *
 * This file re-exports all Zod schemas from the validators directory
 * for convenient access throughout the application.
 */

// Auth schemas
export {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "~/validators/auth.validator";

// Asset schemas
export {
  createAssetSchema,
  updateAssetSchema,
  assignAssetSchema,
  returnAssetSchema,
  transferAssetSchema,
  type CreateAssetInput,
  type UpdateAssetInput,
  type AssignAssetInput,
  type ReturnAssetInput,
  type TransferAssetInput,
} from "~/validators/asset.validator";

// User schemas
export {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type UpdateProfileInput,
} from "~/validators/user.validator";

// Company schemas
export {
  createCompanySchema,
  updateCompanySchema,
  type CreateCompanyInput,
  type UpdateCompanyInput,
} from "~/validators/company.validator";

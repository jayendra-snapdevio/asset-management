import type { ZodSchema } from "zod";
import { ZodError } from "zod";

export type ValidationResult<T> =
  | { success: true; data: T; errors: null }
  | { success: false; data: null; errors: Record<string, string> };

/**
 * Validates form data against a Zod schema.
 * Returns either the validated data or a record of field errors.
 */
export async function validateFormData<T>(
  formData: FormData,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  const rawData = Object.fromEntries(formData);

  try {
    const validData = schema.parse(rawData);
    return { success: true, data: validData, errors: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((e) => {
        if (e.path[0]) {
          // Only keep the first error for each field
          if (!errors[String(e.path[0])]) {
            errors[String(e.path[0])] = e.message;
          }
        }
      });
      return { success: false, data: null, errors };
    }
    throw error;
  }
}

/**
 * Validates raw object data against a Zod schema.
 * Useful when you need to add extra fields before validation.
 */
export async function validateData<T>(
  rawData: Record<string, unknown>,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const validData = schema.parse(rawData);
    return { success: true, data: validData, errors: null };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((e) => {
        if (e.path[0]) {
          if (!errors[String(e.path[0])]) {
            errors[String(e.path[0])] = e.message;
          }
        }
      });
      return { success: false, data: null, errors };
    }
    throw error;
  }
}

/**
 * Converts Zod flattened errors to a simple record format.
 * Useful when using safeParse directly.
 */
export function flattenZodErrors(
  fieldErrors: Record<string, string[] | undefined>
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) {
      errors[key] = messages[0];
    }
  }
  return errors;
}

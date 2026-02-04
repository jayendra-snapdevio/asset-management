import { data } from "react-router";
import { Prisma } from "@prisma/client";

/**
 * Error response type for consistent error handling
 */
export interface ErrorResponse {
  error: string;
  code?: string;
}

/**
 * Creates a standardized error response
 */
export function errorResponse(message: string, status: number = 400, code?: string) {
  return data<ErrorResponse>({ error: message, code }, { status });
}

/**
 * Handles Prisma errors and returns appropriate HTTP responses.
 * Throws non-Prisma errors for handling upstream.
 */
export function handlePrismaError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const target = (error.meta?.target as string[])?.join(", ") || "field";
        return data<ErrorResponse>(
          { error: `A record with this ${target} already exists`, code: "DUPLICATE" },
          { status: 409 }
        );
      }
      case "P2025":
        // Record not found
        return data<ErrorResponse>(
          { error: "Record not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      case "P2003":
        // Foreign key constraint failed
        return data<ErrorResponse>(
          { error: "Related record not found", code: "FOREIGN_KEY" },
          { status: 400 }
        );
      case "P2014":
        // Required relation violation
        return data<ErrorResponse>(
          { error: "This record is required by other records", code: "REQUIRED_RELATION" },
          { status: 400 }
        );
      case "P2016":
        // Query interpretation error
        return data<ErrorResponse>(
          { error: "Invalid query", code: "QUERY_ERROR" },
          { status: 400 }
        );
      case "P2021":
        // Table not found
        return data<ErrorResponse>(
          { error: "Database table not found", code: "TABLE_NOT_FOUND" },
          { status: 500 }
        );
      case "P2024":
        // Connection timeout
        return data<ErrorResponse>(
          { error: "Database connection timeout. Please try again.", code: "TIMEOUT" },
          { status: 503 }
        );
      default:
        console.error("Unhandled Prisma error:", error.code, error.message);
        return data<ErrorResponse>(
          { error: "A database error occurred", code: error.code },
          { status: 500 }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation error:", error.message);
    return data<ErrorResponse>(
      { error: "Invalid data provided", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("Prisma initialization error:", error.message);
    return data<ErrorResponse>(
      { error: "Unable to connect to database", code: "DB_INIT_ERROR" },
      { status: 503 }
    );
  }

  // Re-throw non-Prisma errors
  throw error;
}

/**
 * Wraps an async operation with Prisma error handling.
 * Returns the result or an error response.
 */
export async function withPrismaErrorHandling<T>(
  operation: () => Promise<T>
): Promise<T | ReturnType<typeof data>> {
  try {
    return await operation();
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Class for custom application errors with HTTP status
 */
export class AppError extends Error {
  constructor(
    message: string,
    public status: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Handles any error and returns an appropriate response
 */
export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return data<ErrorResponse>(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }

  // Try Prisma error handling
  try {
    return handlePrismaError(error);
  } catch {
    // If it's not a Prisma error, return generic error
    console.error("Unhandled error:", error);
    return data<ErrorResponse>(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

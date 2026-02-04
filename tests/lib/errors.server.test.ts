import { describe, it, expect, vi, beforeEach } from "vitest";
import { handlePrismaError, errorResponse, handleError, AppError } from "~/lib/errors.server";
import { Prisma } from "@prisma/client";

describe("errorResponse", () => {
  it("should create error response with default status", () => {
    const response = errorResponse("Something went wrong");
    
    expect(response.init?.status).toBe(400);
  });

  it("should create error response with custom status", () => {
    const response = errorResponse("Not found", 404);
    
    expect(response.init?.status).toBe(404);
  });

  it("should include error code if provided", () => {
    const response = errorResponse("Duplicate entry", 409, "DUPLICATE");
    
    expect(response.init?.status).toBe(409);
  });
});

describe("handlePrismaError", () => {
  it("should handle unique constraint violation (P2002)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "5.0.0",
      meta: { target: ["email"] },
    });

    const response = handlePrismaError(error);

    expect(response.init?.status).toBe(409);
  });

  it("should handle record not found (P2025)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "5.0.0",
    });

    const response = handlePrismaError(error);

    expect(response.init?.status).toBe(404);
  });

  it("should handle foreign key constraint (P2003)", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Foreign key", {
      code: "P2003",
      clientVersion: "5.0.0",
    });

    const response = handlePrismaError(error);

    expect(response.init?.status).toBe(400);
  });

  it("should throw non-Prisma errors", () => {
    const error = new Error("Some other error");

    expect(() => handlePrismaError(error)).toThrow("Some other error");
  });

  it("should handle unknown Prisma error codes", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unknown", {
      code: "P9999",
      clientVersion: "5.0.0",
    });

    const response = handlePrismaError(error);

    expect(response.init?.status).toBe(500);
  });
});

describe("handleError", () => {
  it("should handle AppError", () => {
    const error = new AppError("Custom error", 422, "VALIDATION");

    const response = handleError(error);

    expect(response.init?.status).toBe(422);
  });

  it("should handle Prisma errors", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "5.0.0",
    });

    const response = handleError(error);

    expect(response.init?.status).toBe(404);
  });

  it("should handle generic errors", () => {
    const error = new Error("Unknown error");

    const response = handleError(error);

    expect(response.init?.status).toBe(500);
  });
});

describe("AppError", () => {
  it("should create error with default status", () => {
    const error = new AppError("Test error");

    expect(error.message).toBe("Test error");
    expect(error.status).toBe(400);
    expect(error.code).toBeUndefined();
  });

  it("should create error with custom status and code", () => {
    const error = new AppError("Not authorized", 403, "AUTH_FAILED");

    expect(error.message).toBe("Not authorized");
    expect(error.status).toBe(403);
    expect(error.code).toBe("AUTH_FAILED");
  });

  it("should be instance of Error", () => {
    const error = new AppError("Test");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
  });
});

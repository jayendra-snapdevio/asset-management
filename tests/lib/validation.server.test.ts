import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateFormData, validateData, flattenZodErrors } from "~/lib/validation.server";
import { z } from "zod";

describe("validateFormData", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    age: z.coerce.number().optional(),
  });

  it("should return data for valid input", async () => {
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("email", "john@example.com");

    const result = await validateFormData(formData, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "John Doe",
        email: "john@example.com",
      });
      expect(result.errors).toBeNull();
    }
  });

  it("should return errors for invalid input", async () => {
    const formData = new FormData();
    formData.append("name", "");
    formData.append("email", "invalid-email");

    const result = await validateFormData(formData, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.data).toBeNull();
      expect(result.errors?.name).toBe("Name is required");
      expect(result.errors?.email).toBe("Invalid email");
    }
  });

  it("should coerce number fields", async () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("email", "john@test.com");
    formData.append("age", "25");

    const result = await validateFormData(formData, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.age).toBe(25);
      expect(typeof result.data?.age).toBe("number");
    }
  });

  it("should handle missing optional fields", async () => {
    const formData = new FormData();
    formData.append("name", "Jane");
    formData.append("email", "jane@test.com");

    const result = await validateFormData(formData, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.age).toBeUndefined();
    }
  });
});

describe("validateData", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    count: z.number().positive("Count must be positive"),
  });

  it("should validate raw object data", async () => {
    const rawData = { name: "Test", count: 5 };

    const result = await validateData(rawData, testSchema);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Test", count: 5 });
    }
  });

  it("should return errors for invalid object data", async () => {
    const rawData = { name: "", count: -1 };

    const result = await validateData(rawData, testSchema);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors?.name).toBe("Name is required");
      expect(result.errors?.count).toBe("Count must be positive");
    }
  });
});

describe("flattenZodErrors", () => {
  it("should flatten field errors to first message", () => {
    const fieldErrors = {
      name: ["Name is required", "Name must be longer"],
      email: ["Invalid email"],
      age: undefined,
    };

    const result = flattenZodErrors(fieldErrors);

    expect(result).toEqual({
      name: "Name is required",
      email: "Invalid email",
    });
  });

  it("should handle empty errors", () => {
    const result = flattenZodErrors({});

    expect(result).toEqual({});
  });

  it("should ignore undefined field errors", () => {
    const fieldErrors = {
      name: undefined,
      email: [],
    };

    const result = flattenZodErrors(fieldErrors);

    expect(result).toEqual({});
  });
});

import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  loginSchema,
  registerSchema,
} from "~/validators/auth.validator";
import {
  createAssetSchema,
  assignAssetSchema,
  returnAssetSchema,
} from "~/validators/asset.validator";
import {
  createUserSchema,
  updateUserSchema,
} from "~/validators/user.validator";
import {
  createCompanySchema,
} from "~/validators/company.validator";

describe("loginSchema", () => {
  it("should accept valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "password123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("should reject short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });

    expect(result.success).toBe(false);
  });

  it("should reject empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });

    expect(result.success).toBe(false);
  });
});

describe("createAssetSchema", () => {
  it("should accept valid asset data", () => {
    const result = createAssetSchema.safeParse({
      name: "MacBook Pro",
      companyId: "company1",
      status: "AVAILABLE",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createAssetSchema.safeParse({
      name: "",
      companyId: "company1",
      status: "AVAILABLE",
    });

    expect(result.success).toBe(false);
  });

  it("should validate status enum", () => {
    const result = createAssetSchema.safeParse({
      name: "Laptop",
      companyId: "company1",
      status: "INVALID_STATUS",
    });

    expect(result.success).toBe(false);
  });

  it("should accept optional fields", () => {
    const result = createAssetSchema.safeParse({
      name: "Monitor",
      companyId: "company1",
      status: "AVAILABLE",
      serialNumber: "SN123",
      model: "Dell 27inch",
      manufacturer: "Dell",
      category: "ELECTRONICS",
      description: "A nice monitor",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.serialNumber).toBe("SN123");
    }
  });
});

describe("createUserSchema", () => {
  it("should accept valid user data", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    });

    expect(result.success).toBe(true);
  });

  it("should validate role enum", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "Password123",
      firstName: "John",
      lastName: "Doe",
      role: "SUPERADMIN",
    });

    expect(result.success).toBe(false);
  });

  it("should require password with complexity", () => {
    const result = createUserSchema.safeParse({
      email: "user@example.com",
      password: "simple",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    });

    expect(result.success).toBe(false);
  });
});

describe("createCompanySchema", () => {
  it("should accept valid company data", () => {
    const result = createCompanySchema.safeParse({
      name: "Acme Inc",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createCompanySchema.safeParse({
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("should accept optional email", () => {
    const result = createCompanySchema.safeParse({
      name: "Acme Inc",
      email: "contact@acme.com",
    });

    expect(result.success).toBe(true);
  });

  it("should validate email format", () => {
    const result = createCompanySchema.safeParse({
      name: "Acme Inc",
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
  });

  it("should allow empty string for optional email", () => {
    const result = createCompanySchema.safeParse({
      name: "Acme Inc",
      email: "",
    });

    expect(result.success).toBe(true);
  });
});

describe("assignAssetSchema", () => {
  it("should accept valid assignment data", () => {
    const result = assignAssetSchema.safeParse({
      assetId: "asset1",
      userId: "user1",
    });

    expect(result.success).toBe(true);
  });

  it("should require assetId", () => {
    const result = assignAssetSchema.safeParse({
      userId: "user1",
    });

    expect(result.success).toBe(false);
  });

  it("should require userId", () => {
    const result = assignAssetSchema.safeParse({
      assetId: "asset1",
    });

    expect(result.success).toBe(false);
  });
});

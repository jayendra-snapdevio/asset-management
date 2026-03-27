import "@testing-library/jest-dom";
import { vi, beforeAll, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
beforeAll(() => {
  process.env.APP_URL = "http://localhost:5173";
  process.env.JWT_SECRET = "test-secret-key-for-testing-only";
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.DATABASE_URL = "mongodb://localhost:27017/test";
});

// Define mock prisma object with all needed models
const prismaMock = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(() => Promise.resolve(0)),
  },
  company: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(() => Promise.resolve(0)),
  },
  asset: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(() => Promise.resolve(0)),
    groupBy: vi.fn(() => Promise.resolve([])),
  },
  assignment: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(() => Promise.resolve(0)),
  },
  assetRequest: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(() => Promise.resolve(0)),
  },
  $transaction: vi.fn((callback) => {
    if (typeof callback === "function") {
      return callback({
        user: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(() => Promise.resolve([])) },
        asset: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(() => Promise.resolve([])) },
        assignment: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(() => Promise.resolve([])) },
        assetRequest: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(() => Promise.resolve([])) },
      });
    }
    return Promise.resolve(callback);
  }),
  $queryRaw: vi.fn(),
};

// Mock Prisma client module
vi.mock("~/lib/db.server", () => ({
  prisma: prismaMock,
}));

// Mock auth server utilities
vi.mock("~/lib/auth.server", () => ({
  hashPassword: vi.fn((password: string) => Promise.resolve(`hashed_${password}`)),
  verifyPassword: vi.fn((password: string, hash: string) => 
    Promise.resolve(hash === `hashed_${password}`)
  ),
  createToken: vi.fn(() => Promise.resolve("mock-jwt-token")),
  verifyToken: vi.fn(() => Promise.resolve({ userId: "user1" })),
}));

// Mock session server utilities
vi.mock("~/lib/session.server", () => ({
  createSession: vi.fn(() => Promise.resolve("session-cookie")),
  destroySession: vi.fn(() => Promise.resolve("destroyed-cookie")),
  getCurrentUser: vi.fn(() => Promise.resolve(null)),
  requireAuth: vi.fn(() => Promise.resolve({
    id: "user1",
    email: "test@test.com",
    role: "ADMIN",
    companyId: "company1",
  })),
  requireRole: vi.fn((_, roles) => Promise.resolve({
    id: "user1",
    email: "test@test.com",
    role: roles[0],
    companyId: "company1",
  })),
}));

// Mock QR code generation
vi.mock("~/lib/qrcode.server", () => ({
  generateQRCode: vi.fn(() => Promise.resolve("data:image/png;base64,mockqrcode")),
}));

// Mock file system for uploads
const fsMock = {
  writeFile: vi.fn(() => Promise.resolve()),
  unlink: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  readFile: vi.fn(() => Promise.resolve(Buffer.from("mock-file-content"))),
};

vi.mock("fs/promises", () => ({
  ...fsMock,
  default: fsMock,
}));

// Helper to create mock Request objects
export function createMockRequest(
  url: string,
  options?: {
    method?: string;
    formData?: Record<string, string>;
    headers?: Record<string, string>;
  }
) {
  const { method = "GET", formData, headers = {} } = options || {};
  
  let body: BodyInit | undefined;
  if (formData) {
    const fd = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      fd.append(key, value);
    });
    body = fd;
  }

  return new Request(url, {
    method,
    body,
    headers: new Headers(headers),
  });
}

// Helper to create mock user objects
export function createMockUser(overrides?: Partial<{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "ADMIN" | "USER";
  companyId: string | null;
  isActive: boolean;
}>) {
  return {
    id: "user1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "ADMIN" as const,
    companyId: "company1",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create mock asset objects
export function createMockAsset(overrides?: Partial<{
  id: string;
  name: string;
  status: "AVAILABLE" | "ASSIGNED" | "UNDER_MAINTENANCE" | "RETIRED";
  companyId: string;
}>) {
  return {
    id: "asset1",
    name: "Test Asset",
    description: null,
    serialNumber: "SN001",
    model: null,
    manufacturer: null,
    category: "ELECTRONICS",
    status: "AVAILABLE" as const,
    purchaseDate: null,
    purchasePrice: null,
    currentValue: null,
    location: null,
    tags: [],
    qrCode: null,
    imageUrl: null,
    ownershipType: "COMPANY" as const,
    ownerId: null,
    otherOwnership: null,
    companyId: "company1",
    createdById: "user1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Helper to create mock company objects
export function createMockCompany(overrides?: Partial<{
  id: string;
  name: string;
  ownerId: string;
}>) {
  return {
    id: "company1",
    name: "Test Company",
    address: null,
    phone: null,
    email: null,
    website: null,
    description: null,
    isActive: true,
    ownerId: "owner1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

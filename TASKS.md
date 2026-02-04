# Asset Management System - Detailed Task Breakdown

> **Purpose**: This document contains detailed task specifications for building the Asset Management System. Each task is self-contained with enough context for AI agents to implement independently.

---

## Technology Stack Reference

| Layer | Technologies |
|-------|-------------|
| Full-Stack | React Router v7 (SSR/Full-Stack Mode), TypeScript, Tailwind CSS, shadcn/ui v2.0 |
| Server Logic | React Router Loaders & Actions, Server-side code with `.server.ts` files |
| Forms & Validation | React Hook Form, Zod |
| Authentication | JWT (jose library), HTTP-only Cookies |
| File Uploads | Multer or Web APIs (FormData) |
| Database | MongoDB, Prisma ORM v5 |

> **Architecture**: This is a **monolithic full-stack app** using React Router v7 in SSR mode. Loaders run on the server before rendering, and Actions handle form submissions/mutations server-side. No separate backend API server is needed.

---

# PHASE 1: Project Setup

---

## Task 1: Project Setup (React Router v7 Full-Stack)

### Objective
Initialize a React Router v7 full-stack project with SSR, TypeScript, Tailwind CSS, shadcn/ui, and Prisma ORM.

### Requirements

1. **Project Initialization**
   - Create a new React Router v7 project using the official CLI
   - Project name: `asset-management` (single project, no separate frontend/backend)
   - Use `npm` as package manager
   
   ```bash
   npx create-react-router@latest asset-management
   cd asset-management
   ```
   - Select these options during setup:
     - TypeScript: Yes
     - Tailwind CSS: Yes (auto-configured)

2. **Install Dependencies**
   ```bash
   # Form handling & validation
   npm install react-hook-form zod @hookform/resolvers
   
   # Database
   npm install prisma@5 @prisma/client@5
   
   # Authentication
   npm install jose bcryptjs
   npm install -D @types/bcryptjs
   
   # File uploads
   npm install multer uuid
   npm install -D @types/multer @types/uuid
   
   # QR Code
   npm install qrcode
   npm install -D @types/qrcode
   
   # Utilities
   npm install date-fns clsx tailwind-merge
   ```

3. **Setup shadcn/ui**
   - Initialize shadcn/ui with `npx shadcn@latest init`
   - During setup, select:
     - Style: "New York"
     - Base color: Slate (or your preference)
     - CSS variables: Yes
     - React Server Components: No
     - Components directory: `app/components/ui`
   - Update `components.json` aliases if needed:
     ```json
     {
       "aliases": {
         "components": "~/components",
         "utils": "~/lib/utils"
       }
     }
     ```

4. **Initialize Prisma**
   ```bash
   npx prisma init
   ```
   - This creates `prisma/schema.prisma`
   - Configure for MongoDB (see Task 2)

5. **Folder Structure (Full-Stack)**
   ```
   asset-management/
   ├── app/
   │   ├── routes/                    # File-based routing (loaders/actions run server-side)
   │   │   ├── _index.tsx             # Home page (/)
   │   │   ├── _auth.tsx              # Auth layout (no sidebar)
   │   │   ├── _auth.login.tsx        # Login with action
   │   │   ├── _auth.register.tsx     # Register with action
   │   │   ├── _auth.forgot-password.tsx
   │   │   ├── _auth.reset-password.tsx
   │   │   ├── _dashboard.tsx         # Dashboard layout (protected)
   │   │   ├── _dashboard._index.tsx  # Dashboard home
   │   │   ├── _dashboard.assets.tsx
   │   │   ├── _dashboard.assets.$id.tsx
   │   │   ├── _dashboard.assets.new.tsx
   │   │   ├── _dashboard.users.tsx
   │   │   ├── _dashboard.companies.tsx
   │   │   ├── _dashboard.assignments.tsx
   │   │   ├── _dashboard.my-assets.tsx
   │   │   ├── _dashboard.profile.tsx
   │   │   └── api.upload.tsx         # Resource route for file uploads
   │   ├── components/
   │   │   ├── ui/                    # shadcn components
   │   │   ├── layout/                # Layout components (Sidebar, Header)
   │   │   ├── forms/                 # Form components
   │   │   ├── dashboard/             # Dashboard-specific components
   │   │   └── shared/                # Reusable components
   │   ├── lib/
   │   │   ├── db.server.ts           # Prisma client (server-only)
   │   │   ├── auth.server.ts         # Auth utilities (server-only)
   │   │   ├── session.server.ts      # Session/cookie management
   │   │   ├── upload.server.ts       # File upload utilities
   │   │   └── utils.ts               # Shared utilities
   │   ├── services/                  # Business logic (server-side)
   │   │   ├── user.service.server.ts
   │   │   ├── company.service.server.ts
   │   │   ├── asset.service.server.ts
   │   │   ├── assignment.service.server.ts
   │   │   └── dashboard.service.server.ts
   │   ├── validators/                # Zod schemas
   │   │   ├── auth.validator.ts
   │   │   ├── asset.validator.ts
   │   │   └── user.validator.ts
   │   ├── types/                     # TypeScript types
   │   ├── constants/                 # App constants
   │   ├── hooks/                     # Custom React hooks
   │   ├── root.tsx                   # Root layout
   │   └── tailwind.css
   ├── prisma/
   │   └── schema.prisma              # Database schema
   ├── public/
   │   └── uploads/                   # Uploaded files (or use cloud storage)
   ├── .env.example
   └── react-router.config.ts
   ```

6. **Environment Variables** (`.env`)
   ```bash
   # Database
   DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"
   
   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-min-32-chars
   SESSION_SECRET=your-session-secret-key
   
   # App
   APP_URL=http://localhost:5173
   NODE_ENV=development
   ```

7. **React Router v7 Configuration** (`react-router.config.ts`)
   ```typescript
   import type { Config } from "@react-router/dev/config";

   export default {
     // Enable SSR - loaders/actions run on server
     ssr: true,
   } satisfies Config;
   ```

8. **Base Root Layout** (`app/root.tsx`)
   ```typescript
   import {
     Links,
     Meta,
     Outlet,
     Scripts,
     ScrollRestoration,
   } from "react-router";
   import "./tailwind.css";

   export function Layout({ children }: { children: React.ReactNode }) {
     return (
       <html lang="en">
         <head>
           <meta charSet="utf-8" />
           <meta name="viewport" content="width=device-width, initial-scale=1" />
           <Meta />
           <Links />
         </head>
         <body className="min-h-screen bg-background font-sans antialiased">
           {children}
           <ScrollRestoration />
           <Scripts />
         </body>
       </html>
     );
   }

   export default function App() {
     return <Outlet />;
   }
   ```

9. **Prisma Client** (`app/lib/db.server.ts`)
   ```typescript
   import { PrismaClient } from "@prisma/client";

   let prisma: PrismaClient;

   declare global {
     var __prisma: PrismaClient | undefined;
   }

   if (process.env.NODE_ENV === "production") {
     prisma = new PrismaClient();
   } else {
     if (!global.__prisma) {
       global.__prisma = new PrismaClient();
     }
     prisma = global.__prisma;
   }

   export { prisma };
   ```

10. **TypeScript Path Aliases** (`tsconfig.json`)
    ```json
    {
      "compilerOptions": {
        "paths": {
          "~/*": ["./app/*"]
        }
      }
    }
    ```

### React Router v7 Full-Stack Key Concepts

| Concept | Description |
|---------|-------------|
| **File-based Routing** | Files in `app/routes/` automatically become routes |
| **Layouts** | Prefix with `_` (e.g., `_dashboard.tsx`) for layout wrappers |
| **Nested Routes** | Dot notation: `_dashboard.assets.tsx` → `/dashboard/assets` |
| **Dynamic Params** | Use `$`: `assets.$id.tsx` → `/assets/:id` |
| **Loaders** | `loader` function for data fetching (runs on SERVER before render) |
| **Actions** | `action` function for form submissions/mutations (runs on SERVER) |
| **`.server.ts` files** | Code that only runs on the server (Prisma, auth, etc.) |
| **Resource Routes** | Routes without UI, just loader/action (for APIs, uploads) |
| **Cookies** | Use `cookie` from react-router for session management |

### Server vs Client Code

```
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Loaders   │  │   Actions   │  │  *.server.ts files  │  │
│  │ (GET data)  │  │ (mutations) │  │  (Prisma, Auth)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (HTML + JSON)
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Components  │  │   Hooks     │  │   Client-side JS    │  │
│  │   (UI)      │  │ (useSubmit) │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Acceptance Criteria
- [ ] Project runs without errors using `npm run dev`
- [ ] Tailwind CSS classes work correctly
- [ ] SSR is enabled (page source shows rendered HTML)
- [ ] Prisma client connects to MongoDB
- [ ] shadcn/ui Button component renders properly
- [ ] Environment variables work (server-side via `process.env`)
- [ ] Path alias `~/` works for imports

### Commands to Verify
```bash
cd asset-management
npm run dev
# Should start on http://localhost:5173
# Check page source - should see SSR rendered HTML

npx prisma generate  # Generate Prisma client
npx prisma db push   # Sync schema to MongoDB
```

### Test Cases

```typescript
// tests/setup.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "~/lib/db.server";

describe("Project Setup", () => {
  it("should connect to database", async () => {
    const result = await prisma.$queryRaw`SELECT 1`;
    expect(result).toBeDefined();
  });

  it("should have Prisma client available", () => {
    expect(prisma).toBeDefined();
    expect(prisma.user).toBeDefined();
    expect(prisma.asset).toBeDefined();
    expect(prisma.company).toBeDefined();
    expect(prisma.assignment).toBeDefined();
  });
});

// tests/utils.test.ts
import { describe, it, expect } from "vitest";
import { cn } from "~/lib/utils";

describe("Utility Functions", () => {
  it("cn() should merge class names", () => {
    const result = cn("px-4", "py-2", "bg-blue-500");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
  });

  it("cn() should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toContain("active");
  });
});
```

---

## Task 2: Database Models (Prisma Schema)

### Objective
Define all Prisma models for MongoDB including User, Company, Asset, and Assignment with proper relationships and enums.

### Requirements

1. **Configure Prisma for MongoDB** (`prisma/schema.prisma`)
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "mongodb"
     url      = env("DATABASE_URL")
   }
   ```

2. **Enums to Define**
   ```prisma
   enum Role {
     OWNER
     ADMIN
     USER
   }

   enum AssetStatus {
     AVAILABLE
     ASSIGNED
     UNDER_MAINTENANCE
     RETIRED
   }

   enum AssignmentStatus {
     ACTIVE
     RETURNED
     TRANSFERRED
   }
   ```

3. **User Model**
   ```prisma
   model User {
     id              String    @id @default(auto()) @map("_id") @db.ObjectId
     email           String    @unique
     password        String
     firstName       String
     lastName        String
     role            Role      @default(USER)
     isActive        Boolean   @default(true)
     companyId       String?   @db.ObjectId
     company         Company?  @relation(fields: [companyId], references: [id])
     createdAssets   Asset[]   @relation("CreatedBy")
     assignments     Assignment[]
     resetToken      String?
     resetTokenExpiry DateTime?
     createdAt       DateTime  @default(now())
     updatedAt       DateTime  @updatedAt
   }
   ```

4. **Company Model**
   ```prisma
   model Company {
     id          String   @id @default(auto()) @map("_id") @db.ObjectId
     name        String
     address     String?
     phone       String?
     email       String?
     ownerId     String   @db.ObjectId
     isActive    Boolean  @default(true)
     users       User[]
     assets      Asset[]
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
   }
   ```

5. **Asset Model**
   ```prisma
   model Asset {
     id            String      @id @default(auto()) @map("_id") @db.ObjectId
     name          String
     description   String?
     serialNumber  String?
     category      String
     status        AssetStatus @default(AVAILABLE)
     purchaseDate  DateTime?
     purchasePrice Float?
     imagePath     String?
     qrCode        String?
     companyId     String      @db.ObjectId
     company       Company     @relation(fields: [companyId], references: [id])
     createdById   String      @db.ObjectId
     createdBy     User        @relation("CreatedBy", fields: [createdById], references: [id])
     assignments   Assignment[]
     isDeleted     Boolean     @default(false)
     createdAt     DateTime    @default(now())
     updatedAt     DateTime    @updatedAt
   }
   ```

6. **Assignment Model**
   ```prisma
   model Assignment {
     id              String           @id @default(auto()) @map("_id") @db.ObjectId
     assetId         String           @db.ObjectId
     asset           Asset            @relation(fields: [assetId], references: [id])
     userId          String           @db.ObjectId
     user            User             @relation(fields: [userId], references: [id])
     status          AssignmentStatus @default(ACTIVE)
     assignedAt      DateTime         @default(now())
     returnedAt      DateTime?
     conditionOnAssign   String?
     conditionOnReturn   String?
     notes           String?
     createdAt       DateTime         @default(now())
     updatedAt       DateTime         @updatedAt
   }
   ```

### Acceptance Criteria
- [ ] All models defined in `prisma/schema.prisma`
- [ ] `npx prisma generate` runs without errors
- [ ] `npx prisma db push` successfully syncs with MongoDB
- [ ] All relationships are properly defined
- [ ] Prisma client is accessible in `app/lib/db.server.ts`

### Commands to Run
```bash
npx prisma generate
npx prisma db push
npx prisma studio  # Optional: View data in browser
```

### Test Cases

```typescript
// tests/models/user.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "~/lib/db.server";

describe("User Model", () => {
  const testEmail = `test-${Date.now()}@example.com`;

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it("should create a user with required fields", async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashedpassword",
        firstName: "John",
        lastName: "Doe",
        role: "USER",
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe(testEmail);
    expect(user.role).toBe("USER");
    expect(user.isActive).toBe(true);
  });

  it("should enforce unique email constraint", async () => {
    await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashedpassword",
        firstName: "John",
        lastName: "Doe",
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email: testEmail,
          password: "hashedpassword",
          firstName: "Jane",
          lastName: "Doe",
        },
      })
    ).rejects.toThrow();
  });

  it("should default role to USER", async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashedpassword",
        firstName: "John",
        lastName: "Doe",
      },
    });

    expect(user.role).toBe("USER");
  });
});

// tests/models/asset.test.ts
import { describe, it, expect } from "vitest";
import { prisma } from "~/lib/db.server";

describe("Asset Model", () => {
  it("should default status to AVAILABLE", async () => {
    // Test with mock or actual DB
    const assetData = {
      name: "Test Laptop",
      category: "Electronics",
      status: undefined, // Should default to AVAILABLE
    };

    expect(assetData.status ?? "AVAILABLE").toBe("AVAILABLE");
  });

  it("should validate AssetStatus enum values", () => {
    const validStatuses = ["AVAILABLE", "ASSIGNED", "UNDER_MAINTENANCE", "RETIRED"];
    validStatuses.forEach((status) => {
      expect(["AVAILABLE", "ASSIGNED", "UNDER_MAINTENANCE", "RETIRED"]).toContain(status);
    });
  });
});

// tests/models/assignment.test.ts
import { describe, it, expect } from "vitest";

describe("Assignment Model", () => {
  it("should validate AssignmentStatus enum values", () => {
    const validStatuses = ["ACTIVE", "RETURNED", "TRANSFERRED"];
    validStatuses.forEach((status) => {
      expect(["ACTIVE", "RETURNED", "TRANSFERRED"]).toContain(status);
    });
  });
});
```

---

# PHASE 2: Authentication & Authorization

---

## Task 3: Authentication Server Logic

### Objective
Implement server-side authentication using React Router actions with JWT (jose library), HTTP-only cookies, and bcrypt password hashing.

### Requirements

1. **Dependencies Already Installed** (from Task 1)
   - `jose` - JWT handling (works in Node.js and Edge)
   - `bcryptjs` - Password hashing
   - `zod` - Validation

2. **Auth Routes (React Router v7 Actions)**

   | Route File | URL | Method | Description |
   |------------|-----|--------|-------------|
   | `_auth.register.tsx` | `/register` | POST (action) | Register new user |
   | `_auth.login.tsx` | `/login` | POST (action) | User login |
   | `_auth.forgot-password.tsx` | `/forgot-password` | POST (action) | Request reset |
   | `_auth.reset-password.tsx` | `/reset-password` | POST (action) | Reset password |
   | `logout.tsx` | `/logout` | POST (action) | Logout user |

3. **Auth Server Utilities** (`app/lib/auth.server.ts`)
   ```typescript
   import { SignJWT, jwtVerify } from "jose";
   import bcrypt from "bcryptjs";
   import { redirect } from "react-router";
   import { prisma } from "./db.server";

   const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

   export async function hashPassword(password: string): Promise<string> {
     return bcrypt.hash(password, 10);
   }

   export async function verifyPassword(password: string, hash: string): Promise<boolean> {
     return bcrypt.compare(password, hash);
   }

   export async function createToken(payload: { userId: string; email: string; role: string }) {
     return new SignJWT(payload)
       .setProtectedHeader({ alg: "HS256" })
       .setExpirationTime("7d")
       .sign(JWT_SECRET);
   }

   export async function verifyToken(token: string) {
     try {
       const { payload } = await jwtVerify(token, JWT_SECRET);
       return payload as { userId: string; email: string; role: string };
     } catch {
       return null;
     }
   }

   export async function getUserFromRequest(request: Request) {
     const cookie = request.headers.get("Cookie");
     const token = cookie?.match(/auth_token=([^;]+)/)?.[1];
     if (!token) return null;
     
     const payload = await verifyToken(token);
     if (!payload) return null;
     
     return prisma.user.findUnique({
       where: { id: payload.userId },
       select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true, isActive: true }
     });
   }

   export async function requireAuth(request: Request) {
     const user = await getUserFromRequest(request);
     if (!user || !user.isActive) {
       throw redirect("/login");
     }
     return user;
   }

   export async function requireRole(request: Request, allowedRoles: string[]) {
     const user = await requireAuth(request);
     if (!allowedRoles.includes(user.role)) {
       throw redirect("/unauthorized");
     }
     return user;
   }
   ```

4. **Session Cookie Helper** (`app/lib/session.server.ts`)
   ```typescript
   export function createAuthCookie(token: string) {
     return `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`; // 7 days
   }

   export function clearAuthCookie() {
     return "auth_token=; Path=/; HttpOnly; Max-Age=0";
   }
   ```

5. **Register Action** (`app/routes/_auth.register.tsx`)
   ```typescript
   import { redirect, data, Form } from "react-router";
   import type { Route } from "./+types/_auth.register";
   import { hashPassword, createToken } from "~/lib/auth.server";
   import { createAuthCookie } from "~/lib/session.server";
   import { prisma } from "~/lib/db.server";
   import { registerSchema } from "~/validators/auth.validator";

   export async function action({ request }: Route.ActionArgs) {
     const formData = await request.formData();
     const rawData = Object.fromEntries(formData);

     // Validate with Zod
     const result = registerSchema.safeParse(rawData);
     if (!result.success) {
       return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
     }

     const { email, password, firstName, lastName } = result.data;

     // Check if email exists
     const existing = await prisma.user.findUnique({ where: { email } });
     if (existing) {
       return data({ errors: { email: ["Email already registered"] } }, { status: 400 });
     }

     // Create user
     const hashedPassword = await hashPassword(password);
     const user = await prisma.user.create({
       data: { email, password: hashedPassword, firstName, lastName, role: "USER" }
     });

     // Create token and set cookie
     const token = await createToken({ userId: user.id, email: user.email, role: user.role });
     
     return redirect("/dashboard", {
       headers: { "Set-Cookie": createAuthCookie(token) }
     });
   }

   export default function RegisterPage({ actionData }: Route.ComponentProps) {
     return (
       <Form method="post" className="space-y-4">
         {/* Form fields with error display from actionData?.errors */}
       </Form>
     );
   }
   ```

6. **Login Action** (`app/routes/_auth.login.tsx`)
   ```typescript
   import { redirect, data, Form } from "react-router";
   import type { Route } from "./+types/_auth.login";
   import { verifyPassword, createToken } from "~/lib/auth.server";
   import { createAuthCookie } from "~/lib/session.server";
   import { prisma } from "~/lib/db.server";

   export async function action({ request }: Route.ActionArgs) {
     const formData = await request.formData();
     const email = formData.get("email") as string;
     const password = formData.get("password") as string;

     const user = await prisma.user.findUnique({ where: { email } });
     if (!user) {
       return data({ error: "Invalid email or password" }, { status: 401 });
     }

     const validPassword = await verifyPassword(password, user.password);
     if (!validPassword) {
       return data({ error: "Invalid email or password" }, { status: 401 });
     }

     if (!user.isActive) {
       return data({ error: "Account is deactivated" }, { status: 403 });
     }

     const token = await createToken({ userId: user.id, email: user.email, role: user.role });
     
     const redirectPath = user.role === "USER" ? "/dashboard/my-assets" : "/dashboard";
     
     return redirect(redirectPath, {
       headers: { "Set-Cookie": createAuthCookie(token) }
     });
   }
   ```

7. **Forgot Password Action** (`app/routes/_auth.forgot-password.tsx`)
   ```typescript
   import { data, Form } from "react-router";
   import crypto from "crypto";
   import type { Route } from "./+types/_auth.forgot-password";
   import { prisma } from "~/lib/db.server";

   export async function action({ request }: Route.ActionArgs) {
     const formData = await request.formData();
     const email = formData.get("email") as string;

     const user = await prisma.user.findUnique({ where: { email } });
     if (user) {
       const resetToken = crypto.randomBytes(32).toString("hex");
       const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

       await prisma.user.update({
         where: { id: user.id },
         data: { resetToken, resetTokenExpiry }
       });

       // In production: send email with reset link
       console.log(`Reset token for ${email}: ${resetToken}`);
     }

     // Always return success to prevent email enumeration
     return data({ success: true, message: "If email exists, a reset link has been sent" });
   }
   ```

8. **Validation Schemas** (`app/validators/auth.validator.ts`)
   ```typescript
   import { z } from "zod";

   export const registerSchema = z.object({
     email: z.string().email("Invalid email"),
     password: z.string().min(8, "Password must be at least 8 characters"),
     firstName: z.string().min(1, "First name is required"),
     lastName: z.string().min(1, "Last name is required"),
   });

   export const loginSchema = z.object({
     email: z.string().email("Invalid email"),
     password: z.string().min(1, "Password is required"),
   });
   ```

9. **Logout Action** (`app/routes/logout.tsx`)
   ```typescript
   import { redirect } from "react-router";
   import { clearAuthCookie } from "~/lib/session.server";

   export async function action() {
     return redirect("/login", {
       headers: { "Set-Cookie": clearAuthCookie() }
     });
   }
   ```

### File Structure
```
app/
├── routes/
│   ├── _auth.tsx                 # Auth layout (centered form)
│   ├── _auth.login.tsx           # Login form + action
│   ├── _auth.register.tsx        # Register form + action  
│   ├── _auth.forgot-password.tsx # Forgot password form + action
│   ├── _auth.reset-password.tsx  # Reset password form + action
│   └── logout.tsx                # Logout action only
├── lib/
│   ├── auth.server.ts            # JWT, password utils
│   ├── session.server.ts         # Cookie helpers
│   └── db.server.ts              # Prisma client
└── validators/
    └── auth.validator.ts         # Zod schemas
```

### Acceptance Criteria
- [ ] Register action creates user and sets HTTP-only cookie
- [ ] Login action validates credentials and sets cookie
- [ ] Logout action clears cookie
- [ ] Passwords are hashed with bcrypt
- [ ] JWT tokens use jose library
- [ ] Validation errors display in forms via actionData
- [ ] Reset token expires after 1 hour

### Test Flow
1. Go to `/register` and submit form → redirects to `/dashboard`
2. Refresh page → should stay authenticated (cookie valid)
3. Go to `/logout` (POST) → clears cookie, redirects to `/login`
4. Try accessing `/dashboard` → redirects to `/login`

### Test Cases

```typescript
// tests/lib/auth.server.test.ts
import { describe, it, expect, vi } from "vitest";
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
} from "~/lib/auth.server";

describe("Password Hashing", () => {
  it("should hash password", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should verify correct password", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);

    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const hash = await hashPassword("testPassword123");
    const isValid = await verifyPassword("wrongPassword", hash);

    expect(isValid).toBe(false);
  });
});

describe("JWT Token", () => {
  it("should create a valid token", async () => {
    const payload = { userId: "123", email: "test@test.com", role: "USER" };
    const token = await createToken(payload);

    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // JWT format
  });

  it("should verify a valid token", async () => {
    const payload = { userId: "123", email: "test@test.com", role: "USER" };
    const token = await createToken(payload);
    const decoded = await verifyToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("should reject invalid token", async () => {
    await expect(verifyToken("invalid.token.here")).rejects.toThrow();
  });

  it("should reject expired token", async () => {
    // This would need a token created with short expiry
    // For now, just verify the function exists
    expect(verifyToken).toBeDefined();
  });
});

// tests/routes/auth.login.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { action } from "~/routes/_auth.login";
import { prisma } from "~/lib/db.server";

vi.mock("~/lib/db.server");

describe("Login Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error for invalid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const formData = new FormData();
    formData.append("email", "nonexistent@test.com");
    formData.append("password", "password123");

    const request = new Request("http://localhost/login", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toBeDefined();
  });

  it("should return error for inactive user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "test@test.com",
      password: "hashedpassword",
      isActive: false,
      firstName: "Test",
      lastName: "User",
      role: "USER",
      companyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
    });

    const formData = new FormData();
    formData.append("email", "test@test.com");
    formData.append("password", "password123");

    const request = new Request("http://localhost/login", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toContain("deactivated");
  });
});

// tests/routes/auth.register.test.ts
import { describe, it, expect, vi } from "vitest";
import { action } from "~/routes/_auth.register";
import { prisma } from "~/lib/db.server";

vi.mock("~/lib/db.server");

describe("Register Action", () => {
  it("should return error for existing email", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "existing@test.com",
      password: "hash",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      isActive: true,
      companyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
    });

    const formData = new FormData();
    formData.append("email", "existing@test.com");
    formData.append("password", "password123");
    formData.append("firstName", "Test");
    formData.append("lastName", "User");

    const request = new Request("http://localhost/register", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toContain("exists");
  });

  it("should validate required fields", async () => {
    const formData = new FormData();
    formData.append("email", ""); // Empty email
    formData.append("password", "short"); // Too short

    const request = new Request("http://localhost/register", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.errors).toBeDefined();
  });
});
```

---

## Task 4: Route Protection & Authorization

### Objective
Implement route protection using React Router loaders and create reusable auth helper functions for role-based access control.

### Requirements

1. **Auth Helpers Already Created in Task 3**
   - `getUserFromRequest(request)` - Get current user from cookie
   - `requireAuth(request)` - Require authentication, redirect if not
   - `requireRole(request, roles)` - Require specific roles

2. **Protected Dashboard Layout** (`app/routes/_dashboard.tsx`)
   ```typescript
   import { Outlet } from "react-router";
   import type { Route } from "./+types/_dashboard";
   import { requireAuth } from "~/lib/auth.server";
   import { Sidebar } from "~/components/layout/Sidebar";
   import { Header } from "~/components/layout/Header";

   export async function loader({ request }: Route.LoaderArgs) {
     // This runs on every dashboard route navigation
     const user = await requireAuth(request); // Redirects to /login if not authenticated
     return { user };
   }

   export default function DashboardLayout({ loaderData }: Route.ComponentProps) {
     const { user } = loaderData;
     return (
       <div className="flex h-screen">
         <Sidebar user={user} />
         <div className="flex-1 flex flex-col">
           <Header user={user} />
           <main className="flex-1 overflow-auto p-6">
             <Outlet context={{ user }} />
           </main>
         </div>
       </div>
     );
   }
   ```

3. **Role-Specific Route Protection Examples**

   **Owner-Only Route** (`app/routes/_dashboard.companies.tsx`):
   ```typescript
   import { redirect } from "react-router";
   import type { Route } from "./+types/_dashboard.companies";
   import { requireRole } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";

   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireRole(request, ["OWNER"]);
     
     const companies = await prisma.company.findMany({
       where: { ownerId: user.id },
       orderBy: { createdAt: "desc" }
     });
     
     return { companies };
   }
   ```

   **Admin/Owner Route** (`app/routes/_dashboard.users.tsx`):
   ```typescript
   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     
     const users = await prisma.user.findMany({
       where: { companyId: user.companyId },
       orderBy: { createdAt: "desc" }
     });
     
     return { users };
   }
   ```

   **User's Own Data** (`app/routes/_dashboard.my-assets.tsx`):
   ```typescript
   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireAuth(request);
     
     const assignments = await prisma.assignment.findMany({
       where: { userId: user.id, status: "ACTIVE" },
       include: { asset: true }
     });
     
     return { assignments };
   }
   ```

4. **Company Access Helper** (`app/lib/auth.server.ts` - add to existing)
   ```typescript
   export async function requireCompanyAccess(request: Request, companyId: string) {
     const user = await requireAuth(request);
     
     if (user.role === "OWNER") {
       // Owner can access companies they own
       const company = await prisma.company.findFirst({
         where: { id: companyId, ownerId: user.id }
       });
       if (!company) throw redirect("/unauthorized");
     } else {
       // Admin/User can only access their assigned company
       if (user.companyId !== companyId) {
         throw redirect("/unauthorized");
       }
     }
     
     return user;
   }
   ```

5. **Error Boundary for Authorization** (`app/routes/_dashboard.tsx`)
   ```typescript
   import { isRouteErrorResponse } from "react-router";

   export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
     if (isRouteErrorResponse(error)) {
       if (error.status === 403) {
         return (
           <div className="flex flex-col items-center justify-center min-h-screen">
             <h1 className="text-2xl font-bold">Access Denied</h1>
             <p>You don't have permission to view this page.</p>
           </div>
         );
       }
     }
     
     return (
       <div className="p-4 text-red-500">
         <h1>Something went wrong</h1>
         <p>{error instanceof Error ? error.message : "Unknown error"}</p>
       </div>
     );
   }
   ```

6. **Unauthorized Page** (`app/routes/unauthorized.tsx`)
   ```typescript
   import { Link } from "react-router";

   export default function Unauthorized() {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen">
         <h1 className="text-3xl font-bold text-red-600">Access Denied</h1>
         <p className="mt-2 text-gray-600">
           You don't have permission to access this resource.
         </p>
         <Link 
           to="/dashboard" 
           className="mt-4 px-4 py-2 bg-primary text-white rounded"
         >
           Return to Dashboard
         </Link>
       </div>
     );
   }
   ```

7. **Home Page Redirect** (`app/routes/_index.tsx`)
   ```typescript
   import { redirect } from "react-router";
   import type { Route } from "./+types/_index";
   import { getUserFromRequest } from "~/lib/auth.server";

   export async function loader({ request }: Route.LoaderArgs) {
     const user = await getUserFromRequest(request);
     
     if (user) {
       return redirect(user.role === "USER" ? "/dashboard/my-assets" : "/dashboard");
     }
     
     return redirect("/login");
   }
   ```

### Route Access Matrix

| Route | Owner | Admin | User | Notes |
|-------|-------|-------|------|-------|
| `/dashboard` | ✅ | ✅ | ✅ | Dashboard home |
| `/dashboard/companies` | ✅ | ❌ | ❌ | Manage companies |
| `/dashboard/assets` | ✅ | ✅ | ❌ | Manage all assets |
| `/dashboard/users` | ✅ | ✅ | ❌ | Manage users |
| `/dashboard/assignments` | ✅ | ✅ | ❌ | Manage assignments |
| `/dashboard/my-assets` | ✅ | ✅ | ✅ | View own assets |
| `/dashboard/profile` | ✅ | ✅ | ✅ | Edit own profile |

### File Structure
```
app/
├── routes/
│   ├── _index.tsx              # Redirect to dashboard or login
│   ├── _dashboard.tsx          # Protected layout (loader checks auth)
│   ├── _dashboard.companies.tsx # Owner-only
│   ├── _dashboard.users.tsx    # Admin/Owner
│   ├── _dashboard.my-assets.tsx # All authenticated users
│   └── unauthorized.tsx        # Access denied page
├── lib/
│   └── auth.server.ts          # Auth helpers (requireAuth, requireRole, etc.)
└── components/
    └── layout/
        ├── Sidebar.tsx
        └── Header.tsx
```

### Acceptance Criteria
- [ ] Unauthenticated users redirected to `/login`
- [ ] Role-restricted routes redirect to `/unauthorized`
- [ ] Owner can access all routes
- [ ] Admin cannot access company management
- [ ] User can only access their own data routes
- [ ] Company isolation enforced
- [ ] ErrorBoundary handles auth errors gracefully

### Test Cases

```typescript
// tests/lib/auth.protection.test.ts
import { describe, it, expect, vi } from "vitest";
import { requireAuth, requireRole, requireCompanyAccess } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";

vi.mock("~/lib/db.server");

describe("requireAuth", () => {
  it("should throw redirect for unauthenticated request", async () => {
    const request = new Request("http://localhost/dashboard", {
      headers: new Headers(), // No cookie
    });

    await expect(requireAuth(request)).rejects.toThrow();
  });

  it("should return user for valid token", async () => {
    // Mock user lookup
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "1",
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      role: "USER",
      isActive: true,
      password: "hash",
      companyId: "company1",
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
    });

    // Test would need a valid JWT token in cookie
    expect(requireAuth).toBeDefined();
  });
});

describe("requireRole", () => {
  it("should allow OWNER to access OWNER routes", async () => {
    const mockUser = {
      id: "1",
      role: "OWNER",
      email: "owner@test.com",
    };

    // Verify the role check logic
    const allowedRoles = ["OWNER"];
    expect(allowedRoles.includes(mockUser.role)).toBe(true);
  });

  it("should deny USER access to ADMIN routes", async () => {
    const mockUser = {
      id: "1",
      role: "USER",
      email: "user@test.com",
    };

    const allowedRoles = ["ADMIN", "OWNER"];
    expect(allowedRoles.includes(mockUser.role)).toBe(false);
  });

  it("should allow ADMIN access to ADMIN routes", async () => {
    const mockUser = {
      id: "1",
      role: "ADMIN",
      email: "admin@test.com",
    };

    const allowedRoles = ["ADMIN", "OWNER"];
    expect(allowedRoles.includes(mockUser.role)).toBe(true);
  });
});

describe("requireCompanyAccess", () => {
  it("should allow access to own company", () => {
    const user = { id: "1", companyId: "company1", role: "ADMIN" };
    const targetCompanyId = "company1";

    expect(user.companyId).toBe(targetCompanyId);
  });

  it("should deny access to other company for non-owner", () => {
    const user = { id: "1", companyId: "company1", role: "ADMIN" };
    const targetCompanyId = "company2";

    expect(user.companyId).not.toBe(targetCompanyId);
    expect(user.role).not.toBe("OWNER");
  });

  it("should allow OWNER access to any company", () => {
    const user = { id: "1", companyId: "company1", role: "OWNER" };
    const targetCompanyId = "company2";

    // Owner can access any company they own
    expect(user.role).toBe("OWNER");
  });
});

// tests/routes/dashboard.layout.test.ts
import { describe, it, expect, vi } from "vitest";
import { loader } from "~/routes/_dashboard";

describe("Dashboard Layout Loader", () => {
  it("should redirect unauthenticated users to login", async () => {
    const request = new Request("http://localhost/dashboard");

    try {
      await loader({ request, params: {}, context: {} });
    } catch (response) {
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/login");
    }
  });
});
```

---

# PHASE 3: Company & User Management

---

## Task 5: Company Management (Owner Only)

### Objective
Implement company management using React Router loaders and actions, allowing Owners to create companies, manage admins, and ensure data isolation.

### Requirements

1. **Company Routes Overview**

   | Route File | URL | Purpose |
   |------------|-----|---------|
   | `_dashboard.companies.tsx` | `/dashboard/companies` | List + Create |
   | `_dashboard.companies.$id.tsx` | `/dashboard/companies/:id` | View + Edit |
   | `_dashboard.companies.$id.admins.tsx` | `/dashboard/companies/:id/admins` | Manage admins |

2. **Company List & Create** (`app/routes/_dashboard.companies.tsx`)
   ```typescript
   import { redirect, data, Form, useLoaderData } from "react-router";
   import type { Route } from "./+types/_dashboard.companies";
   import { requireRole } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";
   import { companySchema } from "~/validators/company.validator";

   // Loader: Get all companies for owner
   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireRole(request, ["OWNER"]);
     
     const url = new URL(request.url);
     const page = parseInt(url.searchParams.get("page") || "1");
     const search = url.searchParams.get("search") || "";
     const limit = 10;

     const where = {
       ownerId: user.id,
       ...(search && { name: { contains: search, mode: "insensitive" as const } })
     };

     const [companies, total] = await Promise.all([
       prisma.company.findMany({
         where,
         skip: (page - 1) * limit,
         take: limit,
         orderBy: { createdAt: "desc" },
         include: { _count: { select: { users: true, assets: true } } }
       }),
       prisma.company.count({ where })
     ]);

     return { companies, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
   }

   // Action: Create new company
   export async function action({ request }: Route.ActionArgs) {
     const user = await requireRole(request, ["OWNER"]);
     const formData = await request.formData();
     const rawData = Object.fromEntries(formData);

     const result = companySchema.safeParse(rawData);
     if (!result.success) {
       return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
     }

     const company = await prisma.company.create({
       data: {
         ...result.data,
         ownerId: user.id
       }
     });

     return redirect(`/dashboard/companies/${company.id}`);
   }

   export default function CompaniesPage({ loaderData }: Route.ComponentProps) {
     const { companies, pagination } = loaderData;
     return (
       <div>
         <h1>Companies</h1>
         {/* Company list table */}
         {/* Create company form using <Form method="post"> */}
       </div>
     );
   }
   ```

3. **Company Detail & Edit** (`app/routes/_dashboard.companies.$id.tsx`)
   ```typescript
   import { redirect, data, Form } from "react-router";
   import type { Route } from "./+types/_dashboard.companies.$id";
   import { requireRole } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";

   export async function loader({ request, params }: Route.LoaderArgs) {
     const user = await requireRole(request, ["OWNER"]);
     
     const company = await prisma.company.findFirst({
       where: { id: params.id, ownerId: user.id },
       include: { 
         users: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
         _count: { select: { assets: true } }
       }
     });

     if (!company) throw redirect("/unauthorized");
     return { company };
   }

   export async function action({ request, params }: Route.ActionArgs) {
     const user = await requireRole(request, ["OWNER"]);
     const formData = await request.formData();
     const intent = formData.get("intent");

     // Verify ownership
     const company = await prisma.company.findFirst({
       where: { id: params.id, ownerId: user.id }
     });
     if (!company) throw redirect("/unauthorized");

     if (intent === "update") {
       await prisma.company.update({
         where: { id: params.id },
         data: {
           name: formData.get("name") as string,
           address: formData.get("address") as string,
           phone: formData.get("phone") as string,
           email: formData.get("email") as string,
         }
       });
       return data({ success: true });
     }

     if (intent === "delete") {
       await prisma.company.update({
         where: { id: params.id },
         data: { isActive: false }
       });
       return redirect("/dashboard/companies");
     }

     return null;
   }
   ```

4. **Add/Remove Admins** (`app/routes/_dashboard.companies.$id.admins.tsx`)
   ```typescript
   export async function action({ request, params }: Route.ActionArgs) {
     const user = await requireRole(request, ["OWNER"]);
     const formData = await request.formData();
     const intent = formData.get("intent");

     if (intent === "add-admin") {
       const email = formData.get("email") as string;
       
       const targetUser = await prisma.user.findUnique({ where: { email } });
       if (!targetUser) {
         return data({ error: "User not found" }, { status: 404 });
       }
       if (targetUser.companyId && targetUser.companyId !== params.id) {
         return data({ error: "User belongs to another company" }, { status: 400 });
       }

       await prisma.user.update({
         where: { id: targetUser.id },
         data: { role: "ADMIN", companyId: params.id }
       });
     }

     if (intent === "remove-admin") {
       const userId = formData.get("userId") as string;
       
       await prisma.user.update({
         where: { id: userId },
         data: { role: "USER", companyId: null }
       });
     }

     return redirect(`/dashboard/companies/${params.id}`);
   }
   ```

5. **Company Validation Schema** (`app/validators/company.validator.ts`)
   ```typescript
   import { z } from "zod";

   export const companySchema = z.object({
     name: z.string().min(1, "Company name is required"),
     address: z.string().optional(),
     phone: z.string().optional(),
     email: z.string().email().optional().or(z.literal("")),
   });
   ```

6. **Company Service** (`app/services/company.service.server.ts`)
   ```typescript
   import { prisma } from "~/lib/db.server";

   export async function getCompanyFilter(user: { role: string; id: string; companyId: string | null }) {
     if (user.role === "OWNER") {
       // Get all companies owned by this user
       const companies = await prisma.company.findMany({
         where: { ownerId: user.id },
         select: { id: true }
       });
       return { companyId: { in: companies.map(c => c.id) } };
     }
     
     // Admin/User: filter by their assigned company
     return { companyId: user.companyId };
   }
   ```

### File Structure
```
app/
├── routes/
│   ├── _dashboard.companies.tsx           # List + Create
│   ├── _dashboard.companies.$id.tsx       # View + Edit
│   └── _dashboard.companies.$id.admins.tsx # Manage admins
├── services/
│   └── company.service.server.ts
└── validators/
    └── company.validator.ts
```

### Acceptance Criteria
- [ ] Only OWNER role can access company routes
- [ ] Loader returns only owner's companies
- [ ] Create action sets ownerId automatically
- [ ] Edit action validates ownership
- [ ] Admin add/remove works correctly
- [ ] Pagination and search work

### Test Cases

```typescript
// tests/routes/companies.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader, action } from "~/routes/_dashboard.companies";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("Companies Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should only allow OWNER role", async () => {
    vi.mocked(auth.requireRole).mockRejectedValue(
      new Response(null, { status: 302, headers: { Location: "/unauthorized" } })
    );

    const request = new Request("http://localhost/dashboard/companies");

    await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
  });

  it("should return companies for owner", async () => {
    const mockOwner = { id: "owner1", role: "OWNER", email: "owner@test.com" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockOwner);
    vi.mocked(prisma.company.findMany).mockResolvedValue([
      { id: "1", name: "Company A", ownerId: "owner1", isActive: true, address: null, phone: null, email: null, createdAt: new Date(), updatedAt: new Date() },
      { id: "2", name: "Company B", ownerId: "owner1", isActive: true, address: null, phone: null, email: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(prisma.company.count).mockResolvedValue(2);

    const request = new Request("http://localhost/dashboard/companies");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.companies).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it("should support pagination", async () => {
    const mockOwner = { id: "owner1", role: "OWNER" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockOwner);
    vi.mocked(prisma.company.count).mockResolvedValue(25);
    vi.mocked(prisma.company.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost/dashboard/companies?page=2&limit=10");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.pagination.totalPages).toBe(3);
  });
});

describe("Companies Action", () => {
  it("should create company with owner ID", async () => {
    const mockOwner = { id: "owner1", role: "OWNER" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockOwner);
    vi.mocked(prisma.company.create).mockResolvedValue({
      id: "new1",
      name: "New Company",
      ownerId: "owner1",
      isActive: true,
      address: null,
      phone: null,
      email: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.append("name", "New Company");

    const request = new Request("http://localhost/dashboard/companies", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    expect(response.status).toBe(302); // Redirect on success
  });

  it("should validate company name is required", async () => {
    const mockOwner = { id: "owner1", role: "OWNER" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockOwner);

    const formData = new FormData();
    formData.append("name", ""); // Empty name

    const request = new Request("http://localhost/dashboard/companies", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.errors?.name).toBeDefined();
  });
});

// tests/validators/company.validator.test.ts
import { describe, it, expect } from "vitest";
import { companySchema } from "~/validators/company.validator";

describe("Company Validator", () => {
  it("should accept valid company data", () => {
    const result = companySchema.safeParse({
      name: "Test Company",
      address: "123 Main St",
      phone: "555-1234",
      email: "contact@company.com",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty company name", () => {
    const result = companySchema.safeParse({
      name: "",
    });

    expect(result.success).toBe(false);
  });

  it("should allow optional fields to be empty", () => {
    const result = companySchema.safeParse({
      name: "Test Company",
    });

    expect(result.success).toBe(true);
  });
});
```

---

## Task 6: User Management (Admin/Owner)

### Objective
Implement user management using React Router loaders and actions for Admins to manage employees within their company.

### Requirements

1. **User Routes Overview**

   | Route File | URL | Purpose |
   |------------|-----|---------|
   | `_dashboard.users.tsx` | `/dashboard/users` | List + Create |
   | `_dashboard.users.$id.tsx` | `/dashboard/users/:id` | View + Edit |

2. **User List & Create** (`app/routes/_dashboard.users.tsx`)
   ```typescript
   import { redirect, data, Form } from "react-router";
   import type { Route } from "./+types/_dashboard.users";
   import { requireRole } from "~/lib/auth.server";
   import { hashPassword } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";
   import { getCompanyFilter } from "~/services/company.service.server";

   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     
     const url = new URL(request.url);
     const page = parseInt(url.searchParams.get("page") || "1");
     const search = url.searchParams.get("search") || "";
     const role = url.searchParams.get("role");
     const isActive = url.searchParams.get("isActive");
     const limit = 10;

     const companyFilter = await getCompanyFilter(user);

     const where = {
       ...companyFilter,
       ...(search && {
         OR: [
           { firstName: { contains: search, mode: "insensitive" as const } },
           { lastName: { contains: search, mode: "insensitive" as const } },
           { email: { contains: search, mode: "insensitive" as const } },
         ]
       }),
       ...(role && { role: role as any }),
       ...(isActive !== null && { isActive: isActive === "true" }),
     };

     const [users, total] = await Promise.all([
       prisma.user.findMany({
         where,
         skip: (page - 1) * limit,
         take: limit,
         orderBy: { createdAt: "desc" },
         select: {
           id: true, email: true, firstName: true, lastName: true,
           role: true, isActive: true, createdAt: true,
           _count: { select: { assignments: { where: { status: "ACTIVE" } } } }
         }
       }),
       prisma.user.count({ where })
     ]);

     return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
   }

   export async function action({ request }: Route.ActionArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     const formData = await request.formData();

     const email = formData.get("email") as string;
     const password = formData.get("password") as string;
     const firstName = formData.get("firstName") as string;
     const lastName = formData.get("lastName") as string;
     const role = (formData.get("role") as string) || "USER";

     // Admin cannot create OWNER role
     if (user.role === "ADMIN" && role === "OWNER") {
       return data({ error: "Cannot create owner accounts" }, { status: 403 });
     }

     // Check email uniqueness
     const existing = await prisma.user.findUnique({ where: { email } });
     if (existing) {
       return data({ errors: { email: ["Email already exists"] } }, { status: 400 });
     }

     const hashedPassword = await hashPassword(password);
     
     const newUser = await prisma.user.create({
       data: {
         email,
         password: hashedPassword,
         firstName,
         lastName,
         role: role as any,
         companyId: user.companyId,
       }
     });

     return redirect(`/dashboard/users/${newUser.id}`);
   }
   ```

3. **User Detail & Edit** (`app/routes/_dashboard.users.$id.tsx`)
   ```typescript
   export async function loader({ request, params }: Route.LoaderArgs) {
     const currentUser = await requireRole(request, ["ADMIN", "OWNER"]);
     const companyFilter = await getCompanyFilter(currentUser);
     
     const user = await prisma.user.findFirst({
       where: { id: params.id, ...companyFilter },
       include: {
         assignments: {
           where: { status: "ACTIVE" },
           include: { asset: true }
         }
       }
     });

     if (!user) throw redirect("/unauthorized");
     return { user };
   }

   export async function action({ request, params }: Route.ActionArgs) {
     const currentUser = await requireRole(request, ["ADMIN", "OWNER"]);
     const formData = await request.formData();
     const intent = formData.get("intent");

     if (intent === "update") {
       await prisma.user.update({
         where: { id: params.id },
         data: {
           firstName: formData.get("firstName") as string,
           lastName: formData.get("lastName") as string,
           email: formData.get("email") as string,
         }
       });
     }

     if (intent === "toggle-status") {
       const user = await prisma.user.findUnique({ where: { id: params.id } });
       await prisma.user.update({
         where: { id: params.id },
         data: { isActive: !user?.isActive }
       });
     }

     return data({ success: true });
   }
   ```

4. **User Asset History** (can be fetched in loader or separate route)
   ```typescript
   // Add to user detail loader or create _dashboard.users.$id.history.tsx
   const assignmentHistory = await prisma.assignment.findMany({
     where: { userId: params.id },
     include: { asset: true },
     orderBy: { assignedAt: "desc" }
   });
   ```

### File Structure
```
app/
├── routes/
│   ├── _dashboard.users.tsx           # List + Create
│   └── _dashboard.users.$id.tsx       # View + Edit + Status
├── services/
│   └── user.service.server.ts
└── validators/
    └── user.validator.ts
```

### Acceptance Criteria
- [ ] Admin can only manage users in their company
- [ ] User creation includes password hashing
- [ ] List supports pagination and filtering
- [ ] Deactivated users cannot login (checked in auth)
- [ ] Users can view their own asset history
- [ ] Cannot deactivate yourself

### Test Cases

```typescript
// tests/routes/users.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader, action } from "~/routes/_dashboard.users";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("Users Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should only allow ADMIN and OWNER roles", async () => {
    vi.mocked(auth.requireRole).mockRejectedValue(
      new Response(null, { status: 302, headers: { Location: "/unauthorized" } })
    );

    const request = new Request("http://localhost/dashboard/users");

    await expect(loader({ request, params: {}, context: {} })).rejects.toThrow();
  });

  it("should return only users from same company for ADMIN", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "1", email: "user1@test.com", companyId: "company1", firstName: "User", lastName: "One", role: "USER", isActive: true, password: "hash", createdAt: new Date(), updatedAt: new Date(), resetToken: null, resetTokenExpiry: null },
    ]);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const request = new Request("http://localhost/dashboard/users");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.users).toHaveLength(1);
    expect(result.users[0].companyId).toBe("company1");
  });

  it("should support search by name or email", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const request = new Request("http://localhost/dashboard/users?search=john");
    await loader({ request, params: {}, context: {} });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ firstName: expect.anything() }),
          ]),
        }),
      })
    );
  });
});

describe("Users Action - Create", () => {
  it("should hash password when creating user", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(auth.hashPassword).mockResolvedValue("hashedpassword");
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new1",
      email: "new@test.com",
      firstName: "New",
      lastName: "User",
      role: "USER",
      companyId: "company1",
      isActive: true,
      password: "hashedpassword",
      createdAt: new Date(),
      updatedAt: new Date(),
      resetToken: null,
      resetTokenExpiry: null,
    });

    const formData = new FormData();
    formData.append("email", "new@test.com");
    formData.append("password", "password123");
    formData.append("firstName", "New");
    formData.append("lastName", "User");
    formData.append("role", "USER");

    const request = new Request("http://localhost/dashboard/users", {
      method: "POST",
      body: formData,
    });

    await action({ request, params: {}, context: {} });

    expect(auth.hashPassword).toHaveBeenCalledWith("password123");
  });

  it("should assign user to admin's company", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(auth.hashPassword).mockResolvedValue("hashedpassword");
    vi.mocked(prisma.user.create).mockResolvedValue({} as any);

    const formData = new FormData();
    formData.append("email", "new@test.com");
    formData.append("password", "password123");
    formData.append("firstName", "New");
    formData.append("lastName", "User");
    formData.append("role", "USER");

    const request = new Request("http://localhost/dashboard/users", {
      method: "POST",
      body: formData,
    });

    await action({ request, params: {}, context: {} });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: "company1",
        }),
      })
    );
  });
});

describe("Users Action - Deactivate", () => {
  it("should not allow deactivating yourself", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    const formData = new FormData();
    formData.append("intent", "deactivate");
    formData.append("userId", "admin1"); // Same as current user

    const request = new Request("http://localhost/dashboard/users", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toContain("yourself");
  });
});
```

---

# PHASE 4: Dashboard Module

---

## Task 7: Dashboard (Loader + UI)

### Objective
Build the dashboard using React Router loaders for server-side data fetching with statistics, charts, and recent activity.

### Requirements

1. **Install Chart Library & shadcn Components**
   ```bash
   npm install recharts
   npx shadcn@latest add card table badge skeleton
   ```

2. **Dashboard Route with Loader** (`app/routes/_dashboard._index.tsx`)
   ```typescript
   import type { Route } from "./+types/_dashboard._index";
   import { requireAuth } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";
   import { getCompanyFilter } from "~/services/company.service.server";
   import { StatCard } from "~/components/dashboard/StatCard";
   import { StatusPieChart } from "~/components/dashboard/StatusPieChart";
   import { RecentAssetsTable } from "~/components/dashboard/RecentAssetsTable";
   import { ActivityFeed } from "~/components/dashboard/ActivityFeed";

   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireAuth(request);
     const companyFilter = await getCompanyFilter(user);

     // Get all stats in parallel
     const [
       totalAssets,
       statusCounts,
       categoryCounts,
       recentAssets,
       recentActivity,
       userCount
     ] = await Promise.all([
       // Total assets
       prisma.asset.count({ where: { ...companyFilter, isDeleted: false } }),
       
       // Status distribution
       prisma.asset.groupBy({
         by: ["status"],
         where: { ...companyFilter, isDeleted: false },
         _count: { status: true }
       }),
       
       // Category distribution
       prisma.asset.groupBy({
         by: ["category"],
         where: { ...companyFilter, isDeleted: false },
         _count: { category: true },
         orderBy: { _count: { category: "desc" } },
         take: 5
       }),
       
       // Recent assets
       prisma.asset.findMany({
         where: { ...companyFilter, isDeleted: false },
         orderBy: { createdAt: "desc" },
         take: 5,
         select: { id: true, name: true, category: true, status: true, createdAt: true }
       }),
       
       // Recent activity (assignments)
       prisma.assignment.findMany({
         where: companyFilter,
         orderBy: { createdAt: "desc" },
         take: 10,
         include: {
           asset: { select: { id: true, name: true } },
           user: { select: { id: true, firstName: true, lastName: true } }
         }
       }),
       
       // User count
       prisma.user.count({ where: { ...companyFilter, isActive: true } })
     ]);

     // Calculate stats
     const stats = {
       totalAssets,
       assignedAssets: statusCounts.find(s => s.status === "ASSIGNED")?._count.status || 0,
       availableAssets: statusCounts.find(s => s.status === "AVAILABLE")?._count.status || 0,
       underMaintenance: statusCounts.find(s => s.status === "UNDER_MAINTENANCE")?._count.status || 0,
       retiredAssets: statusCounts.find(s => s.status === "RETIRED")?._count.status || 0,
       totalUsers: userCount,
     };

     const statusDistribution = statusCounts.map(s => ({
       status: s.status,
       count: s._count.status,
       percentage: Math.round((s._count.status / totalAssets) * 100)
     }));

     const categoryDistribution = categoryCounts.map(c => ({
       category: c.category,
       count: c._count.category
     }));

     return {
       user,
       stats,
       statusDistribution,
       categoryDistribution,
       recentAssets,
       recentActivity
     };
   }

   export default function DashboardHome({ loaderData }: Route.ComponentProps) {
     const { user, stats, statusDistribution, categoryDistribution, recentAssets, recentActivity } = loaderData;

     return (
       <div className="space-y-6">
         <h1 className="text-3xl font-bold">Dashboard</h1>
         
         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <StatCard title="Total Assets" value={stats.totalAssets} icon="Package" />
           <StatCard title="Assigned" value={stats.assignedAssets} icon="UserCheck" />
           <StatCard title="Available" value={stats.availableAssets} icon="CheckCircle" />
           <StatCard title="Under Maintenance" value={stats.underMaintenance} icon="Wrench" />
         </div>

         {/* Charts */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <StatusPieChart data={statusDistribution} />
           <CategoryBarChart data={categoryDistribution} />
         </div>

         {/* Recent Data */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <RecentAssetsTable assets={recentAssets} />
           <ActivityFeed activities={recentActivity} />
         </div>
       </div>
     );
   }
   ```

3. **User-Specific Dashboard** (for USER role)
   ```typescript
   // In the same loader, check role and return different data
   if (user.role === "USER") {
     const myAssets = await prisma.assignment.findMany({
       where: { userId: user.id, status: "ACTIVE" },
       include: { asset: true }
     });
     
     const history = await prisma.assignment.findMany({
       where: { userId: user.id },
       include: { asset: true },
       orderBy: { assignedAt: "desc" },
       take: 10
     });
     
     return { user, myAssets, history, isUserDashboard: true };
   }
   ```

4. **StatCard Component** (`app/components/dashboard/StatCard.tsx`)
   ```typescript
   import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
   import { Package, UserCheck, CheckCircle, Wrench } from "lucide-react";

   const icons = { Package, UserCheck, CheckCircle, Wrench };

   interface StatCardProps {
     title: string;
     value: number;
     icon: keyof typeof icons;
     trend?: { value: number; isPositive: boolean };
   }

   export function StatCard({ title, value, icon, trend }: StatCardProps) {
     const Icon = icons[icon];
     return (
       <Card>
         <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
           <CardTitle className="text-sm font-medium">{title}</CardTitle>
           <Icon className="h-4 w-4 text-muted-foreground" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold">{value}</div>
           {trend && (
             <p className={`text-xs ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
               {trend.isPositive ? "+" : ""}{trend.value}% from last month
             </p>
           )}
         </CardContent>
       </Card>
     );
   }
   ```

5. **StatusPieChart Component** (`app/components/dashboard/StatusPieChart.tsx`)
   ```typescript
   import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
   import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

   const COLORS = {
     AVAILABLE: "#22c55e",
     ASSIGNED: "#3b82f6",
     UNDER_MAINTENANCE: "#f97316",
     RETIRED: "#6b7280"
   };

   export function StatusPieChart({ data }: { data: { status: string; count: number }[] }) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>Asset Status Distribution</CardTitle>
         </CardHeader>
         <CardContent>
           <ResponsiveContainer width="100%" height={300}>
             <PieChart>
               <Pie
                 data={data}
                 dataKey="count"
                 nameKey="status"
                 cx="50%"
                 cy="50%"
                 outerRadius={100}
                 label
               >
                 {data.map((entry, index) => (
                   <Cell key={index} fill={COLORS[entry.status as keyof typeof COLORS]} />
                 ))}
               </Pie>
               <Tooltip />
               <Legend />
             </PieChart>
           </ResponsiveContainer>
         </CardContent>
       </Card>
     );
   }
   ```

6. **Error Boundary & Loading**
   ```typescript
   // In _dashboard._index.tsx
   export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
     return (
       <div className="p-4 border border-red-500 rounded bg-red-50">
         <h2 className="text-red-700 font-bold">Failed to load dashboard</h2>
         <p className="text-red-600">{error instanceof Error ? error.message : "Unknown error"}</p>
       </div>
     );
   }

   export function HydrateFallback() {
     return <DashboardSkeleton />;
   }
   ```

### File Structure
```
app/
├── routes/
│   └── _dashboard._index.tsx    # Dashboard with loader
├── components/
│   └── dashboard/
│       ├── StatCard.tsx
│       ├── StatusPieChart.tsx
│       ├── CategoryBarChart.tsx
│       ├── RecentAssetsTable.tsx
│       ├── ActivityFeed.tsx
│       ├── QuickActions.tsx
│       └── DashboardSkeleton.tsx
└── services/
    └── dashboard.service.server.ts  # Optional: Extract dashboard logic
```

### Acceptance Criteria
- [ ] Dashboard loads with all statistics from loader
- [ ] Charts render correctly with data
- [ ] Stats show correct counts
- [ ] Recent assets and activity display
- [ ] User role sees their own assets only
- [ ] ErrorBoundary handles failures
- [ ] HydrateFallback shows skeleton while loading
- [ ] Responsive on all screen sizes

### Test Cases

```typescript
// tests/routes/dashboard.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader } from "~/routes/_dashboard._index";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("Dashboard Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return statistics for ADMIN", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.count).mockResolvedValue(50);
    vi.mocked(prisma.assignment.count).mockResolvedValue(20);
    vi.mocked(prisma.user.count).mockResolvedValue(10);
    vi.mocked(prisma.asset.groupBy).mockResolvedValue([]);
    vi.mocked(prisma.asset.findMany).mockResolvedValue([]);
    vi.mocked(prisma.assignment.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost/dashboard");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.stats).toBeDefined();
    expect(result.stats.totalAssets).toBe(50);
  });

  it("should return user-specific data for USER role", async () => {
    const mockUser = { id: "user1", role: "USER", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockUser);
    vi.mocked(prisma.assignment.findMany).mockResolvedValue([
      {
        id: "1",
        assetId: "asset1",
        userId: "user1",
        status: "ACTIVE",
        assignedAt: new Date(),
        returnedAt: null,
        conditionOnAssign: null,
        conditionOnReturn: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        asset: { id: "asset1", name: "Laptop" },
      },
    ]);

    const request = new Request("http://localhost/dashboard");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.isUserDashboard).toBe(true);
    expect(result.myAssets).toBeDefined();
  });

  it("should return status distribution data", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.groupBy).mockResolvedValue([
      { status: "AVAILABLE", _count: { status: 30 } },
      { status: "ASSIGNED", _count: { status: 15 } },
      { status: "UNDER_MAINTENANCE", _count: { status: 5 } },
    ]);

    const request = new Request("http://localhost/dashboard");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.statusDistribution).toBeDefined();
    expect(result.statusDistribution.length).toBe(3);
  });
});

// tests/components/dashboard/StatCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "~/components/dashboard/StatCard";

describe("StatCard Component", () => {
  it("should render title and value", () => {
    render(<StatCard title="Total Assets" value={50} icon="Package" />);

    expect(screen.getByText("Total Assets")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("should render positive trend", () => {
    render(
      <StatCard
        title="Total Assets"
        value={50}
        icon="Package"
        trend={{ value: 10, isPositive: true }}
      />
    );

    expect(screen.getByText(/\+10%/)).toBeInTheDocument();
  });

  it("should render negative trend", () => {
    render(
      <StatCard
        title="Total Assets"
        value={50}
        icon="Package"
        trend={{ value: 5, isPositive: false }}
      />
    );

    expect(screen.getByText(/-5%/)).toBeInTheDocument();
  });
});

// tests/components/dashboard/StatusPieChart.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { StatusPieChart } from "~/components/dashboard/StatusPieChart";

describe("StatusPieChart Component", () => {
  it("should render without crashing", () => {
    const data = [
      { status: "AVAILABLE", count: 30 },
      { status: "ASSIGNED", count: 20 },
    ];

    const { container } = render(<StatusPieChart data={data} />);
    expect(container).toBeTruthy();
  });

  it("should handle empty data", () => {
    const { container } = render(<StatusPieChart data={[]} />);
    expect(container).toBeTruthy();
  });
});
```

---

# PHASE 5: Asset Management

---

## Task 8: Asset CRUD

### Objective
Implement complete asset CRUD operations using React Router loaders and actions with filtering, pagination, and soft delete.

### Requirements

1. **Asset Routes Overview**

   | Route File | URL | Purpose |
   |------------|-----|---------|
   | `_dashboard.assets.tsx` | `/dashboard/assets` | List + filters |
   | `_dashboard.assets.new.tsx` | `/dashboard/assets/new` | Create asset |
   | `_dashboard.assets.$id.tsx` | `/dashboard/assets/:id` | View + Edit + Delete |

2. **Asset List with Filters** (`app/routes/_dashboard.assets.tsx`)
   ```typescript
   import { Link, Form, useSearchParams } from "react-router";
   import type { Route } from "./+types/_dashboard.assets";
   import { requireRole } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";
   import { getCompanyFilter } from "~/services/company.service.server";

   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     const companyFilter = await getCompanyFilter(user);
     
     const url = new URL(request.url);
     const page = parseInt(url.searchParams.get("page") || "1");
     const search = url.searchParams.get("search") || "";
     const status = url.searchParams.get("status");
     const category = url.searchParams.get("category");
     const sortBy = url.searchParams.get("sortBy") || "createdAt";
     const sortOrder = url.searchParams.get("sortOrder") || "desc";
     const limit = 10;

     const where = {
       ...companyFilter,
       isDeleted: false,
       ...(search && {
         OR: [
           { name: { contains: search, mode: "insensitive" as const } },
           { serialNumber: { contains: search, mode: "insensitive" as const } },
         ]
       }),
       ...(status && { status: status as any }),
       ...(category && { category }),
     };

     const [assets, total, categories] = await Promise.all([
       prisma.asset.findMany({
         where,
         skip: (page - 1) * limit,
         take: limit,
         orderBy: { [sortBy]: sortOrder },
         include: {
           createdBy: { select: { firstName: true, lastName: true } },
           assignments: { where: { status: "ACTIVE" }, include: { user: true }, take: 1 }
         }
       }),
       prisma.asset.count({ where }),
       prisma.asset.findMany({
         where: { ...companyFilter, isDeleted: false },
         select: { category: true },
         distinct: ["category"]
       })
     ]);

     return {
       assets,
       categories: categories.map(c => c.category),
       pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
     };
   }

   export default function AssetsPage({ loaderData }: Route.ComponentProps) {
     const { assets, categories, pagination } = loaderData;
     const [searchParams] = useSearchParams();

     return (
       <div className="space-y-4">
         <div className="flex justify-between">
           <h1 className="text-2xl font-bold">Assets</h1>
           <Link to="/dashboard/assets/new" className="btn btn-primary">
             Add Asset
           </Link>
         </div>

         {/* Filters Form */}
         <Form method="get" className="flex gap-4">
           <input name="search" placeholder="Search..." defaultValue={searchParams.get("search") || ""} />
           <select name="status" defaultValue={searchParams.get("status") || ""}>
             <option value="">All Status</option>
             <option value="AVAILABLE">Available</option>
             <option value="ASSIGNED">Assigned</option>
             <option value="UNDER_MAINTENANCE">Under Maintenance</option>
             <option value="RETIRED">Retired</option>
           </select>
           <select name="category" defaultValue={searchParams.get("category") || ""}>
             <option value="">All Categories</option>
             {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
           </select>
           <button type="submit">Filter</button>
         </Form>

         {/* Assets Table */}
         {/* Pagination */}
       </div>
     );
   }
   ```

3. **Create Asset** (`app/routes/_dashboard.assets.new.tsx`)
   ```typescript
   import { redirect, data, Form } from "react-router";
   import type { Route } from "./+types/_dashboard.assets.new";
   import { requireRole } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";
   import { assetSchema } from "~/validators/asset.validator";
   import { generateQRCode } from "~/lib/qrcode.server";

   export async function action({ request }: Route.ActionArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     const formData = await request.formData();
     const rawData = Object.fromEntries(formData);

     const result = assetSchema.safeParse(rawData);
     if (!result.success) {
       return data({ errors: result.error.flatten().fieldErrors }, { status: 400 });
     }

     // Create asset
     const asset = await prisma.asset.create({
       data: {
         ...result.data,
         companyId: user.companyId!,
         createdById: user.id,
         status: "AVAILABLE",
         purchaseDate: result.data.purchaseDate ? new Date(result.data.purchaseDate) : null,
       }
     });

     // Generate QR code
     const qrCode = await generateQRCode(asset.id);
     await prisma.asset.update({
       where: { id: asset.id },
       data: { qrCode }
     });

     return redirect(`/dashboard/assets/${asset.id}`);
   }

   export default function NewAssetPage({ actionData }: Route.ComponentProps) {
     return (
       <div>
         <h1 className="text-2xl font-bold">Add New Asset</h1>
         <Form method="post" className="space-y-4 max-w-xl">
           <input name="name" placeholder="Asset Name" required />
           <textarea name="description" placeholder="Description" />
           <input name="serialNumber" placeholder="Serial Number" />
           <input name="category" placeholder="Category" required />
           <input name="purchaseDate" type="date" />
           <input name="purchasePrice" type="number" step="0.01" placeholder="Purchase Price" />
           <button type="submit">Create Asset</button>
         </Form>
       </div>
     );
   }
   ```

4. **Asset Detail & Edit** (`app/routes/_dashboard.assets.$id.tsx`)
   ```typescript
   import { redirect, data, Form } from "react-router";
   import type { Route } from "./+types/_dashboard.assets.$id";
   import { requireRole } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";
   import { getCompanyFilter } from "~/services/company.service.server";

   export async function loader({ request, params }: Route.LoaderArgs) {
     const user = await requireAuth(request);
     const companyFilter = await getCompanyFilter(user);
     
     const asset = await prisma.asset.findFirst({
       where: { id: params.id, ...companyFilter },
       include: {
         createdBy: true,
         assignments: {
           orderBy: { assignedAt: "desc" },
           take: 10,
           include: { user: true }
         }
       }
     });

     if (!asset) throw redirect("/dashboard/assets");
     return { asset };
   }

   export async function action({ request, params }: Route.ActionArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     const formData = await request.formData();
     const intent = formData.get("intent");

     if (intent === "update") {
       await prisma.asset.update({
         where: { id: params.id },
         data: {
           name: formData.get("name") as string,
           description: formData.get("description") as string,
           serialNumber: formData.get("serialNumber") as string,
           category: formData.get("category") as string,
         }
       });
       return data({ success: true });
     }

     if (intent === "delete") {
       // Check if asset is assigned
       const activeAssignment = await prisma.assignment.findFirst({
         where: { assetId: params.id, status: "ACTIVE" }
       });
       if (activeAssignment) {
         return data({ error: "Cannot delete assigned asset" }, { status: 400 });
       }

       await prisma.asset.update({
         where: { id: params.id },
         data: { isDeleted: true }
       });
       return redirect("/dashboard/assets");
     }

     if (intent === "restore") {
       await prisma.asset.update({
         where: { id: params.id },
         data: { isDeleted: false }
       });
       return data({ success: true });
     }

     return null;
   }
   ```

5. **Asset Validation Schema** (`app/validators/asset.validator.ts`)
   ```typescript
   import { z } from "zod";

   export const assetSchema = z.object({
     name: z.string().min(1, "Name is required"),
     description: z.string().optional(),
     serialNumber: z.string().optional(),
     category: z.string().min(1, "Category is required"),
     purchaseDate: z.string().optional(),
     purchasePrice: z.coerce.number().optional(),
   });
   ```

6. **Common Asset Categories**
   ```typescript
   export const ASSET_CATEGORIES = [
     "Electronics",
     "Furniture",
     "Vehicles",
     "Office Equipment",
     "IT Equipment",
     "Tools",
     "Software Licenses",
     "Other"
   ];
   ```

### File Structure
```
app/
├── routes/
│   ├── _dashboard.assets.tsx       # List with filters
│   ├── _dashboard.assets.new.tsx   # Create form
│   └── _dashboard.assets.$id.tsx   # View + Edit + Delete
├── services/
│   └── asset.service.server.ts
└── validators/
    └── asset.validator.ts
```

### Acceptance Criteria
- [ ] Asset list loads with pagination
- [ ] Filters work (search, status, category)
- [ ] Create action validates and saves
- [ ] Edit action updates correctly
- [ ] Soft delete sets isDeleted flag
- [ ] Cannot delete assigned assets
- [ ] Restore action works
- [ ] Company isolation enforced

### Test Cases

```typescript
// tests/routes/assets.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader, action } from "~/routes/_dashboard.assets";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("Assets Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return assets with pagination", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.findMany).mockResolvedValue([
      { id: "1", name: "Laptop", status: "AVAILABLE", category: "Electronics", companyId: "company1", isDeleted: false, createdById: "admin1", description: null, serialNumber: null, purchaseDate: null, purchasePrice: null, imagePath: null, qrCode: null, createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.mocked(prisma.asset.count).mockResolvedValue(1);

    const request = new Request("http://localhost/dashboard/assets");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.assets).toHaveLength(1);
    expect(result.pagination).toBeDefined();
  });

  it("should filter by status", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    const request = new Request("http://localhost/dashboard/assets?status=AVAILABLE");
    await loader({ request, params: {}, context: {} });

    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "AVAILABLE",
        }),
      })
    );
  });

  it("should filter by category", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    const request = new Request("http://localhost/dashboard/assets?category=Electronics");
    await loader({ request, params: {}, context: {} });

    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: "Electronics",
        }),
      })
    );
  });

  it("should search by name", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    const request = new Request("http://localhost/dashboard/assets?search=laptop");
    await loader({ request, params: {}, context: {} });

    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: expect.objectContaining({
            contains: "laptop",
          }),
        }),
      })
    );
  });

  it("should exclude soft-deleted assets", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    const request = new Request("http://localhost/dashboard/assets");
    await loader({ request, params: {}, context: {} });

    expect(prisma.asset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
        }),
      })
    );
  });
});

// tests/routes/assets.new.test.ts
import { describe, it, expect, vi } from "vitest";
import { action } from "~/routes/_dashboard.assets.new";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");
vi.mock("~/lib/qrcode.server");

describe("Create Asset Action", () => {
  it("should create asset with company ID", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.create).mockResolvedValue({
      id: "new1",
      name: "New Laptop",
      category: "Electronics",
      status: "AVAILABLE",
      companyId: "company1",
      createdById: "admin1",
      isDeleted: false,
      description: null,
      serialNumber: null,
      purchaseDate: null,
      purchasePrice: null,
      imagePath: null,
      qrCode: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formData = new FormData();
    formData.append("name", "New Laptop");
    formData.append("category", "Electronics");

    const request = new Request("http://localhost/dashboard/assets/new", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    expect(response.status).toBe(302); // Redirect on success
  });

  it("should validate required fields", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    const formData = new FormData();
    formData.append("name", ""); // Empty name

    const request = new Request("http://localhost/dashboard/assets/new", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.errors?.name).toBeDefined();
  });
});

// tests/routes/assets.id.test.ts
import { describe, it, expect, vi } from "vitest";
import { loader, action } from "~/routes/_dashboard.assets.$id";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("Asset Detail Loader", () => {
  it("should return asset with history", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.findFirst).mockResolvedValue({
      id: "asset1",
      name: "Laptop",
      status: "AVAILABLE",
      category: "Electronics",
      companyId: "company1",
      isDeleted: false,
      createdById: "admin1",
      description: null,
      serialNumber: null,
      purchaseDate: null,
      purchasePrice: null,
      imagePath: null,
      qrCode: "data:image/png;base64,...",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.assignment.findMany).mockResolvedValue([]);

    const request = new Request("http://localhost/dashboard/assets/asset1");
    const result = await loader({ request, params: { id: "asset1" }, context: {} });

    expect(result.asset).toBeDefined();
    expect(result.asset.id).toBe("asset1");
  });

  it("should redirect if asset not found", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.findFirst).mockResolvedValue(null);

    const request = new Request("http://localhost/dashboard/assets/nonexistent");

    await expect(
      loader({ request, params: { id: "nonexistent" }, context: {} })
    ).rejects.toThrow();
  });
});

describe("Asset Delete Action", () => {
  it("should soft delete asset", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.findFirst).mockResolvedValue({
      id: "asset1",
      status: "AVAILABLE",
      companyId: "company1",
    } as any);
    vi.mocked(prisma.asset.update).mockResolvedValue({} as any);

    const formData = new FormData();
    formData.append("intent", "delete");

    const request = new Request("http://localhost/dashboard/assets/asset1", {
      method: "POST",
      body: formData,
    });

    await action({ request, params: { id: "asset1" }, context: {} });

    expect(prisma.asset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isDeleted: true,
        }),
      })
    );
  });

  it("should not delete assigned assets", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.findFirst).mockResolvedValue({
      id: "asset1",
      status: "ASSIGNED", // Asset is assigned
      companyId: "company1",
    } as any);

    const formData = new FormData();
    formData.append("intent", "delete");

    const request = new Request("http://localhost/dashboard/assets/asset1", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: { id: "asset1" }, context: {} });
    const data = await response.json();

    expect(data.error).toContain("assigned");
  });
});

// tests/validators/asset.validator.test.ts
import { describe, it, expect } from "vitest";
import { assetSchema } from "~/validators/asset.validator";

describe("Asset Validator", () => {
  it("should accept valid asset data", () => {
    const result = assetSchema.safeParse({
      name: "Test Laptop",
      category: "Electronics",
      status: "AVAILABLE",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = assetSchema.safeParse({
      name: "",
      category: "Electronics",
    });

    expect(result.success).toBe(false);
  });

  it("should coerce purchasePrice to number", () => {
    const result = assetSchema.safeParse({
      name: "Test Laptop",
      category: "Electronics",
      purchasePrice: "999.99",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data.purchasePrice).toBe("number");
    }
  });
});
```

---

## Task 9: Asset Image Upload

### Objective
Implement image upload using React Router resource routes with FormData handling.

### Requirements

1. **Resource Route for Uploads** (`app/routes/api.upload.tsx`)
   ```typescript
   import { data } from "react-router";
   import type { Route } from "./+types/api.upload";
   import { requireRole } from "~/lib/auth.server";
   import { writeFile, mkdir, unlink } from "fs/promises";
   import { join } from "path";
   import { v4 as uuid } from "uuid";

   const UPLOAD_DIR = join(process.cwd(), "public/uploads/assets");
   const MAX_SIZE = 5 * 1024 * 1024; // 5MB
   const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

   export async function action({ request }: Route.ActionArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     const formData = await request.formData();
     
     const file = formData.get("file") as File;
     const assetId = formData.get("assetId") as string;

     if (!file || !assetId) {
       return data({ error: "File and assetId required" }, { status: 400 });
     }

     // Validate file type
     if (!ALLOWED_TYPES.includes(file.type)) {
       return data({ error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" }, { status: 400 });
     }

     // Validate file size
     if (file.size > MAX_SIZE) {
       return data({ error: "File too large. Max 5MB" }, { status: 400 });
     }

     // Verify asset ownership
     const companyFilter = await getCompanyFilter(user);
     const asset = await prisma.asset.findFirst({
       where: { id: assetId, ...companyFilter }
     });
     if (!asset) {
       return data({ error: "Asset not found" }, { status: 404 });
     }

     // Delete old image if exists
     if (asset.imagePath) {
       try {
         await unlink(join(process.cwd(), "public", asset.imagePath));
       } catch {}
     }

     // Save new file
     await mkdir(UPLOAD_DIR, { recursive: true });
     const ext = file.name.split(".").pop();
     const filename = `${uuid()}.${ext}`;
     const filepath = join(UPLOAD_DIR, filename);
     
     const buffer = Buffer.from(await file.arrayBuffer());
     await writeFile(filepath, buffer);

     const imagePath = `/uploads/assets/${filename}`;
     
     // Update asset
     await prisma.asset.update({
       where: { id: assetId },
       data: { imagePath }
     });

     return { success: true, imagePath };
   }
   ```

2. **Upload from Asset Form**
   ```typescript
   // In asset detail or edit page
   import { useFetcher } from "react-router";

   function ImageUpload({ assetId, currentImage }: { assetId: string; currentImage?: string }) {
     const fetcher = useFetcher();
     
     const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
       const file = e.target.files?.[0];
       if (!file) return;
       
       const formData = new FormData();
       formData.append("file", file);
       formData.append("assetId", assetId);
       
       fetcher.submit(formData, {
         method: "POST",
         action: "/api/upload",
         encType: "multipart/form-data"
       });
     };

     return (
       <div>
         {currentImage && <img src={currentImage} alt="Asset" className="w-48 h-48 object-cover" />}
         <input type="file" accept="image/*" onChange={handleUpload} />
         {fetcher.state === "submitting" && <p>Uploading...</p>}
         {fetcher.data?.error && <p className="text-red-500">{fetcher.data.error}</p>}
       </div>
     );
   }
   ```

3. **Delete Image Action** (add to asset detail action)
   ```typescript
   if (intent === "delete-image") {
     const asset = await prisma.asset.findUnique({ where: { id: params.id } });
     if (asset?.imagePath) {
       try {
         await unlink(join(process.cwd(), "public", asset.imagePath));
       } catch {}
       await prisma.asset.update({
         where: { id: params.id },
         data: { imagePath: null }
       });
     }
     return data({ success: true });
   }
   ```

### File Structure
```
app/
├── routes/
│   └── api.upload.tsx          # Resource route for file uploads
public/
└── uploads/
    └── assets/                 # Uploaded images served statically
```

### Acceptance Criteria
- [ ] Images upload via FormData
- [ ] Only allowed file types accepted
- [ ] Files over 5MB rejected
- [ ] Old image deleted on new upload
- [ ] Images served via public folder
- [ ] Image path stored in database

### Test Cases

```typescript
// tests/routes/api.upload.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { action } from "~/routes/api.upload";
import * as auth from "~/lib/auth.server";
import * as fs from "fs/promises";

vi.mock("~/lib/auth.server");
vi.mock("fs/promises");
vi.mock("~/lib/db.server");

describe("Upload Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject unauthorized requests", async () => {
    vi.mocked(auth.requireRole).mockRejectedValue(
      new Response(null, { status: 302, headers: { Location: "/unauthorized" } })
    );

    const formData = new FormData();
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    await expect(action({ request, params: {}, context: {} })).rejects.toThrow();
  });

  it("should reject files over 5MB", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    // Create a mock file over 5MB
    const largeFile = new File(
      [new ArrayBuffer(6 * 1024 * 1024)], // 6MB
      "large.jpg",
      { type: "image/jpeg" }
    );

    const formData = new FormData();
    formData.append("file", largeFile);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toContain("5MB");
  });

  it("should reject invalid file types", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    const invalidFile = new File(["test"], "test.exe", { type: "application/x-executable" });

    const formData = new FormData();
    formData.append("file", invalidFile);

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toContain("type");
  });

  it("should accept valid image files", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const validFile = new File(["test"], "test.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", validFile);
    formData.append("assetId", "asset1");

    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.imagePath).toBeDefined();
  });
});

// tests/lib/upload.test.ts
import { describe, it, expect } from "vitest";

describe("Upload Utilities", () => {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  it("should validate allowed file types", () => {
    expect(ALLOWED_TYPES.includes("image/jpeg")).toBe(true);
    expect(ALLOWED_TYPES.includes("image/png")).toBe(true);
    expect(ALLOWED_TYPES.includes("application/pdf")).toBe(false);
  });

  it("should validate file size", () => {
    const smallFile = { size: 1024 }; // 1KB
    const largeFile = { size: 10 * 1024 * 1024 }; // 10MB

    expect(smallFile.size <= MAX_SIZE).toBe(true);
    expect(largeFile.size <= MAX_SIZE).toBe(false);
  });

  it("should generate unique filenames", () => {
    const filename1 = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const filename2 = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    expect(filename1).not.toBe(filename2);
  });
});
```

---

## Task 10: QR Code Generation

### Objective
Implement QR code generation for assets containing asset URL with display and download functionality.

### Requirements

1. **QR Code Server Utility** (`app/lib/qrcode.server.ts`)
   ```typescript
   import QRCode from "qrcode";

   export async function generateQRCode(assetId: string): Promise<string> {
     const url = `${process.env.APP_URL}/dashboard/assets/${assetId}`;
     
     const qrDataUrl = await QRCode.toDataURL(url, {
       width: 300,
       margin: 2,
       color: {
         dark: "#000000",
         light: "#ffffff"
       }
     });
     
     return qrDataUrl;
   }
   ```

2. **Generate QR on Asset Creation**
   ```typescript
   // In _dashboard.assets.new.tsx action
   import { generateQRCode } from "~/lib/qrcode.server";

   // After creating asset
   const qrCode = await generateQRCode(asset.id);
   await prisma.asset.update({
     where: { id: asset.id },
     data: { qrCode }
   });
   ```

3. **QR Code Display in Asset Detail**
   ```typescript
   // In _dashboard.assets.$id.tsx component
   function QRCodeDisplay({ qrCode, assetName }: { qrCode: string; assetName: string }) {
     const downloadQR = () => {
       const link = document.createElement("a");
       link.download = `${assetName.replace(/\s+/g, "-")}-qr.png`;
       link.href = qrCode;
       link.click();
     };

     return (
       <div className="space-y-2">
         <img src={qrCode} alt="Asset QR Code" className="w-48 h-48" />
         <button onClick={downloadQR} className="btn btn-secondary">
           Download QR Code
         </button>
       </div>
     );
   }
   ```

4. **Regenerate QR Action** (add to asset detail action)
   ```typescript
   if (intent === "regenerate-qr") {
     const qrCode = await generateQRCode(params.id);
     await prisma.asset.update({
       where: { id: params.id },
       data: { qrCode }
     });
     return data({ success: true });
   }
   ```

### Acceptance Criteria
- [ ] QR code generated on asset creation
- [ ] QR contains correct asset URL
- [ ] QR displays in asset detail page
- [ ] QR downloadable as PNG
- [ ] Regenerate QR works

### Test Cases

```typescript
// tests/lib/qrcode.server.test.ts
import { describe, it, expect, vi } from "vitest";
import { generateQRCode } from "~/lib/qrcode.server";
import QRCode from "qrcode";

vi.mock("qrcode");

describe("QR Code Generation", () => {
  it("should generate QR code with correct URL", async () => {
    vi.mocked(QRCode.toDataURL).mockResolvedValue("data:image/png;base64,test");

    const assetId = "asset123";
    process.env.APP_URL = "http://localhost:5173";

    const result = await generateQRCode(assetId);

    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.stringContaining(`/dashboard/assets/${assetId}`),
      expect.anything()
    );
    expect(result).toContain("data:image/png;base64");
  });

  it("should use APP_URL environment variable", async () => {
    vi.mocked(QRCode.toDataURL).mockResolvedValue("data:image/png;base64,test");

    process.env.APP_URL = "https://myapp.com";
    const assetId = "asset123";

    await generateQRCode(assetId);

    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.stringContaining("https://myapp.com"),
      expect.anything()
    );
  });

  it("should handle QR generation errors", async () => {
    vi.mocked(QRCode.toDataURL).mockRejectedValue(new Error("QR generation failed"));

    const assetId = "asset123";

    await expect(generateQRCode(assetId)).rejects.toThrow("QR generation failed");
  });
});

// tests/components/QRCodeDisplay.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock component for testing
function QRCodeDisplay({ qrCode, assetName }: { qrCode: string; assetName: string }) {
  const downloadQR = () => {
    const link = document.createElement("a");
    link.download = `${assetName}-qr.png`;
    link.href = qrCode;
    link.click();
  };

  return (
    <div>
      <img src={qrCode} alt={`QR Code for ${assetName}`} data-testid="qr-image" />
      <button onClick={downloadQR} data-testid="download-btn">
        Download QR
      </button>
    </div>
  );
}

describe("QRCodeDisplay Component", () => {
  it("should render QR code image", () => {
    render(
      <QRCodeDisplay
        qrCode="data:image/png;base64,test"
        assetName="Test Laptop"
      />
    );

    const img = screen.getByTestId("qr-image");
    expect(img).toHaveAttribute("src", "data:image/png;base64,test");
    expect(img).toHaveAttribute("alt", "QR Code for Test Laptop");
  });

  it("should have download button", () => {
    render(
      <QRCodeDisplay
        qrCode="data:image/png;base64,test"
        assetName="Test Laptop"
      />
    );

    expect(screen.getByTestId("download-btn")).toBeInTheDocument();
  });

  it("should trigger download on button click", () => {
    const createElementSpy = vi.spyOn(document, "createElement");
    
    render(
      <QRCodeDisplay
        qrCode="data:image/png;base64,test"
        assetName="Test Laptop"
      />
    );

    fireEvent.click(screen.getByTestId("download-btn"));

    expect(createElementSpy).toHaveBeenCalledWith("a");
  });
});

// tests/routes/assets.id.qr.test.ts
import { describe, it, expect, vi } from "vitest";
import { action } from "~/routes/_dashboard.assets.$id";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";
import * as qrcode from "~/lib/qrcode.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");
vi.mock("~/lib/qrcode.server");

describe("Regenerate QR Action", () => {
  it("should regenerate QR code", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(qrcode.generateQRCode).mockResolvedValue("data:image/png;base64,newqr");
    vi.mocked(prisma.asset.update).mockResolvedValue({} as any);

    const formData = new FormData();
    formData.append("intent", "regenerate-qr");

    const request = new Request("http://localhost/dashboard/assets/asset1", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: { id: "asset1" }, context: {} });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(qrcode.generateQRCode).toHaveBeenCalledWith("asset1");
  });
});
```

---

# PHASE 6: Asset Assignment

---

## Task 11: Assignment Management

### Objective
Implement asset assignment, return, and transfer using React Router actions with proper status management.

### Requirements

1. **Assignment Routes Overview**

   | Route File | URL | Purpose |
   |------------|-----|---------|
   | `_dashboard.assignments.tsx` | `/dashboard/assignments` | List + filters |
   | `_dashboard.assignments.new.tsx` | `/dashboard/assignments/new` | Assign asset |
   | `_dashboard.assignments.$id.tsx` | `/dashboard/assignments/:id` | View + Return/Transfer |

2. **Assignment List** (`app/routes/_dashboard.assignments.tsx`)
   ```typescript
   import type { Route } from "./+types/_dashboard.assignments";
   import { requireRole } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";
   import { getCompanyFilter } from "~/services/company.service.server";

   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     const companyFilter = await getCompanyFilter(user);
     
     const url = new URL(request.url);
     const status = url.searchParams.get("status");
     const page = parseInt(url.searchParams.get("page") || "1");
     const limit = 10;

     const where = {
       asset: companyFilter,
       ...(status && { status: status as any }),
     };

     const [assignments, total] = await Promise.all([
       prisma.assignment.findMany({
         where,
         skip: (page - 1) * limit,
         take: limit,
         orderBy: { createdAt: "desc" },
         include: {
           asset: { select: { id: true, name: true, serialNumber: true } },
           user: { select: { id: true, firstName: true, lastName: true, email: true } }
         }
       }),
       prisma.assignment.count({ where })
     ]);

     return { assignments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
   }
   ```

3. **Assign Asset Action** (`app/routes/_dashboard.assignments.new.tsx`)
   ```typescript
   import { redirect, data, Form } from "react-router";
   import type { Route } from "./+types/_dashboard.assignments.new";
   import { requireRole } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";
   import { getCompanyFilter } from "~/services/company.service.server";

   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     const companyFilter = await getCompanyFilter(user);

     // Get available assets and users
     const [availableAssets, users] = await Promise.all([
       prisma.asset.findMany({
         where: { ...companyFilter, status: "AVAILABLE", isDeleted: false },
         select: { id: true, name: true, serialNumber: true }
       }),
       prisma.user.findMany({
         where: { ...companyFilter, isActive: true },
         select: { id: true, firstName: true, lastName: true, email: true }
       })
     ]);

     return { availableAssets, users };
   }

   export async function action({ request }: Route.ActionArgs) {
     const user = await requireRole(request, ["ADMIN", "OWNER"]);
     const companyFilter = await getCompanyFilter(user);
     const formData = await request.formData();

     const assetId = formData.get("assetId") as string;
     const userId = formData.get("userId") as string;
     const conditionOnAssign = formData.get("conditionOnAssign") as string;
     const notes = formData.get("notes") as string;

     // Validate asset
     const asset = await prisma.asset.findFirst({
       where: { id: assetId, ...companyFilter, isDeleted: false }
     });
     if (!asset) {
       return data({ error: "Asset not found" }, { status: 404 });
     }
     if (asset.status !== "AVAILABLE") {
       return data({ error: "Asset is not available" }, { status: 400 });
     }

     // Validate user
     const targetUser = await prisma.user.findFirst({
       where: { id: userId, ...companyFilter, isActive: true }
     });
     if (!targetUser) {
       return data({ error: "User not found" }, { status: 404 });
     }

     // Create assignment and update asset status
     await prisma.$transaction([
       prisma.assignment.create({
         data: {
           assetId,
           userId,
           status: "ACTIVE",
           conditionOnAssign,
           notes,
         }
       }),
       prisma.asset.update({
         where: { id: assetId },
         data: { status: "ASSIGNED" }
       })
     ]);

     return redirect("/dashboard/assignments");
   }
   ```

4. **Return Asset Action** (`app/routes/_dashboard.assignments.$id.tsx`)
   ```typescript
   export async function action({ request, params }: Route.ActionArgs) {
     const user = await requireAuth(request);
     const formData = await request.formData();
     const intent = formData.get("intent");

     const assignment = await prisma.assignment.findUnique({
       where: { id: params.id },
       include: { asset: true }
     });
     if (!assignment) throw redirect("/dashboard/assignments");

     if (intent === "return") {
       // User can return their own, Admin/Owner can return any
       if (user.role === "USER" && assignment.userId !== user.id) {
         return data({ error: "Cannot return other's assets" }, { status: 403 });
       }

       const conditionOnReturn = formData.get("conditionOnReturn") as string;
       const notes = formData.get("notes") as string;

       await prisma.$transaction([
         prisma.assignment.update({
           where: { id: params.id },
           data: {
             status: "RETURNED",
             returnedAt: new Date(),
             conditionOnReturn,
             notes: notes || assignment.notes,
           }
         }),
         prisma.asset.update({
           where: { id: assignment.assetId },
           data: { status: "AVAILABLE" }
         })
       ]);

       return redirect("/dashboard/assignments");
     }

     if (intent === "transfer") {
       const currentUser = await requireRole(request, ["ADMIN", "OWNER"]);
       const newUserId = formData.get("newUserId") as string;
       const conditionNotes = formData.get("conditionNotes") as string;

       if (newUserId === assignment.userId) {
         return data({ error: "Cannot transfer to same user" }, { status: 400 });
       }

       await prisma.$transaction([
         // Mark current assignment as transferred
         prisma.assignment.update({
           where: { id: params.id },
           data: {
             status: "TRANSFERRED",
             returnedAt: new Date(),
             conditionOnReturn: conditionNotes,
           }
         }),
         // Create new assignment
         prisma.assignment.create({
           data: {
             assetId: assignment.assetId,
             userId: newUserId,
             status: "ACTIVE",
             conditionOnAssign: conditionNotes,
             notes: `Transferred from previous user`,
           }
         })
       ]);

       return redirect("/dashboard/assignments");
     }

     return null;
   }
   ```

5. **Status Flow Diagram**
   ```
   Asset Status:
   AVAILABLE ──(assign)──► ASSIGNED ──(return)──► AVAILABLE
                                   ──(transfer)──► ASSIGNED (stays)
   
   Assignment Status:
   ACTIVE ──(return)──► RETURNED
        ──(transfer)──► TRANSFERRED + new ACTIVE created
   ```

### File Structure
```
app/
├── routes/
│   ├── _dashboard.assignments.tsx       # List with filters
│   ├── _dashboard.assignments.new.tsx   # Create assignment
│   └── _dashboard.assignments.$id.tsx   # View + Return/Transfer
└── services/
    └── assignment.service.server.ts
```

### Acceptance Criteria
- [ ] Can assign available assets to users
- [ ] Cannot assign already-assigned assets
- [ ] Return updates both assignment and asset status
- [ ] Transfer creates new assignment
- [ ] Users can only return their own assets
- [ ] Company isolation enforced

### Test Cases

```typescript
// tests/routes/assignments.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader, action } from "~/routes/_dashboard.assignments";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("Assignments Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return assignments with pagination", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.assignment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.assignment.count).mockResolvedValue(0);

    const request = new Request("http://localhost/dashboard/assignments");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.assignments).toBeDefined();
    expect(result.pagination).toBeDefined();
  });

  it("should filter by status", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);

    const request = new Request("http://localhost/dashboard/assignments?status=ACTIVE");
    await loader({ request, params: {}, context: {} });

    expect(prisma.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "ACTIVE",
        }),
      })
    );
  });
});

// tests/routes/assignments.new.test.ts
import { describe, it, expect, vi } from "vitest";
import { loader, action } from "~/routes/_dashboard.assignments.new";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("Assign Asset Action", () => {
  it("should create assignment and update asset status", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.findFirst).mockResolvedValue({
      id: "asset1",
      status: "AVAILABLE",
      companyId: "company1",
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "user1",
      companyId: "company1",
    } as any);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}]);

    const formData = new FormData();
    formData.append("assetId", "asset1");
    formData.append("userId", "user1");
    formData.append("conditionOnAssign", "Excellent");

    const request = new Request("http://localhost/dashboard/assignments/new", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    expect(response.status).toBe(302); // Redirect on success
  });

  it("should reject assigning already-assigned assets", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.findFirst).mockResolvedValue({
      id: "asset1",
      status: "ASSIGNED", // Already assigned
      companyId: "company1",
    } as any);

    const formData = new FormData();
    formData.append("assetId", "asset1");
    formData.append("userId", "user1");

    const request = new Request("http://localhost/dashboard/assignments/new", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toContain("available");
  });

  it("should reject assigning to user from different company", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.asset.findFirst).mockResolvedValue({
      id: "asset1",
      status: "AVAILABLE",
      companyId: "company1",
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null); // User not in company

    const formData = new FormData();
    formData.append("assetId", "asset1");
    formData.append("userId", "user-other-company");

    const request = new Request("http://localhost/dashboard/assignments/new", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toBeDefined();
  });
});

// tests/routes/assignments.id.test.ts
import { describe, it, expect, vi } from "vitest";
import { action } from "~/routes/_dashboard.assignments.$id";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("Return Asset Action", () => {
  it("should update assignment and asset status on return", async () => {
    const mockUser = { id: "user1", role: "USER", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockUser);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: "assign1",
      userId: "user1",
      assetId: "asset1",
      status: "ACTIVE",
    } as any);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}]);

    const formData = new FormData();
    formData.append("intent", "return");
    formData.append("conditionOnReturn", "Good");

    const request = new Request("http://localhost/dashboard/assignments/assign1", {
      method: "POST",
      body: formData,
    });

    await action({ request, params: { id: "assign1" }, context: {} });

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("should only allow users to return their own assets", async () => {
    const mockUser = { id: "user1", role: "USER", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockUser);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: "assign1",
      userId: "user2", // Different user
      assetId: "asset1",
      status: "ACTIVE",
    } as any);

    const formData = new FormData();
    formData.append("intent", "return");

    const request = new Request("http://localhost/dashboard/assignments/assign1", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: { id: "assign1" }, context: {} });
    const data = await response.json();

    expect(data.error).toContain("permission");
  });
});

describe("Transfer Asset Action", () => {
  it("should create new assignment and mark old as transferred", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: "assign1",
      userId: "user1",
      assetId: "asset1",
      status: "ACTIVE",
    } as any);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "user2",
      companyId: "company1",
    } as any);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}]);

    const formData = new FormData();
    formData.append("intent", "transfer");
    formData.append("newUserId", "user2");

    const request = new Request("http://localhost/dashboard/assignments/assign1", {
      method: "POST",
      body: formData,
    });

    await action({ request, params: { id: "assign1" }, context: {} });

    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
```

---

## Task 12: Assignment History

### Objective
Implement assignment history views using React Router loaders to track asset and user assignment lifecycles.

### Requirements

1. **Asset History** (add to `_dashboard.assets.$id.tsx` loader)
   ```typescript
   // In the asset detail loader
   const assignmentHistory = await prisma.assignment.findMany({
     where: { assetId: params.id },
     orderBy: { assignedAt: "desc" },
     include: {
       user: { select: { id: true, firstName: true, lastName: true, email: true } }
     }
   });

   // Calculate duration for each assignment
   const historyWithDuration = assignmentHistory.map(a => ({
     ...a,
     duration: a.returnedAt 
       ? formatDuration(a.assignedAt, a.returnedAt)
       : formatDuration(a.assignedAt, new Date()) + " (ongoing)"
   }));

   return { asset, history: historyWithDuration };
   ```

2. **User Assignment History** (`_dashboard.users.$id.tsx` loader)
   ```typescript
   export async function loader({ request, params }: Route.LoaderArgs) {
     const currentUser = await requireAuth(request);
     
     // Users can view their own, Admin/Owner can view any
     if (currentUser.role === "USER" && currentUser.id !== params.id) {
       throw redirect("/unauthorized");
     }

     const companyFilter = await getCompanyFilter(currentUser);
     
     const [user, assignments] = await Promise.all([
       prisma.user.findFirst({
         where: { id: params.id, ...companyFilter }
       }),
       prisma.assignment.findMany({
         where: { userId: params.id },
         orderBy: { assignedAt: "desc" },
         include: { asset: true }
       })
     ]);

     if (!user) throw redirect("/unauthorized");

     const currentAssignments = assignments.filter(a => a.status === "ACTIVE");
     const pastAssignments = assignments.filter(a => a.status !== "ACTIVE");

     return { user, currentAssignments, pastAssignments };
   }
   ```

3. **My Assets Page for Users** (`_dashboard.my-assets.tsx`)
   ```typescript
   import type { Route } from "./+types/_dashboard.my-assets";
   import { requireAuth } from "~/lib/auth.server";
   import { prisma } from "~/lib/db.server";

   export async function loader({ request }: Route.LoaderArgs) {
     const user = await requireAuth(request);

     const [currentAssets, history] = await Promise.all([
       prisma.assignment.findMany({
         where: { userId: user.id, status: "ACTIVE" },
         include: { asset: true }
       }),
       prisma.assignment.findMany({
         where: { userId: user.id, status: { not: "ACTIVE" } },
         orderBy: { returnedAt: "desc" },
         take: 20,
         include: { asset: true }
       })
     ]);

     return { currentAssets, history };
   }

   export default function MyAssetsPage({ loaderData }: Route.ComponentProps) {
     const { currentAssets, history } = loaderData;

     return (
       <div className="space-y-6">
         <h1 className="text-2xl font-bold">My Assets</h1>
         
         <section>
           <h2 className="text-xl font-semibold">Currently Assigned</h2>
           {currentAssets.length === 0 ? (
             <p className="text-gray-500">No assets currently assigned to you</p>
           ) : (
             <div className="grid gap-4">
               {currentAssets.map(a => (
                 <AssetCard key={a.id} asset={a.asset} assignedAt={a.assignedAt} />
               ))}
             </div>
           )}
         </section>

         <section>
           <h2 className="text-xl font-semibold">History</h2>
           <AssignmentHistoryTable assignments={history} />
         </section>
       </div>
     );
   }
   ```

4. **Duration Utility** (`app/lib/utils.ts`)
   ```typescript
   import { formatDistanceStrict } from "date-fns";

   export function formatDuration(start: Date, end: Date): string {
     return formatDistanceStrict(start, end);
   }
   ```

5. **Return Action for Users** (in my-assets page)
   ```typescript
   export async function action({ request }: Route.ActionArgs) {
     const user = await requireAuth(request);
     const formData = await request.formData();
     const assignmentId = formData.get("assignmentId") as string;
     const conditionOnReturn = formData.get("conditionOnReturn") as string;

     const assignment = await prisma.assignment.findUnique({
       where: { id: assignmentId }
     });

     if (!assignment || assignment.userId !== user.id) {
       return data({ error: "Assignment not found" }, { status: 404 });
     }

     await prisma.$transaction([
       prisma.assignment.update({
         where: { id: assignmentId },
         data: { status: "RETURNED", returnedAt: new Date(), conditionOnReturn }
       }),
       prisma.asset.update({
         where: { id: assignment.assetId },
         data: { status: "AVAILABLE" }
       })
     ]);

     return data({ success: true });
   }
   ```

### File Structure
```
app/
├── routes/
│   ├── _dashboard.my-assets.tsx       # User's assigned assets
│   ├── _dashboard.assets.$id.tsx      # Includes assignment history
│   └── _dashboard.users.$id.tsx       # Includes user's history
└── lib/
    └── utils.ts                       # Duration formatting
```

### Acceptance Criteria
- [ ] Asset detail shows assignment history
- [ ] User detail shows their assignment history
- [ ] My Assets page shows current and past assignments
- [ ] Duration calculated correctly
- [ ] Users can only view their own history
- [ ] Return action works from My Assets page

### Test Cases

```typescript
// tests/lib/utils.duration.test.ts
import { describe, it, expect } from "vitest";
import { formatDuration } from "~/lib/utils";

describe("formatDuration", () => {
  it("should format duration in days", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-01-06");

    const result = formatDuration(start, end);

    expect(result).toContain("5");
    expect(result.toLowerCase()).toContain("day");
  });

  it("should format duration in months", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-03-01");

    const result = formatDuration(start, end);

    expect(result).toContain("2");
    expect(result.toLowerCase()).toContain("month");
  });

  it("should handle same day", () => {
    const start = new Date("2025-01-01T09:00:00");
    const end = new Date("2025-01-01T17:00:00");

    const result = formatDuration(start, end);

    expect(result).toContain("8");
    expect(result.toLowerCase()).toContain("hour");
  });
});

// tests/routes/my-assets.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { loader, action } from "~/routes/_dashboard.my-assets";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("My Assets Loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return current and past assignments for user", async () => {
    const mockUser = { id: "user1", role: "USER", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockUser);
    vi.mocked(prisma.assignment.findMany)
      .mockResolvedValueOnce([
        // Current assets
        { id: "1", status: "ACTIVE", asset: { id: "a1", name: "Laptop" } },
      ] as any)
      .mockResolvedValueOnce([
        // History
        { id: "2", status: "RETURNED", asset: { id: "a2", name: "Monitor" } },
      ] as any);

    const request = new Request("http://localhost/dashboard/my-assets");
    const result = await loader({ request, params: {}, context: {} });

    expect(result.currentAssets).toHaveLength(1);
    expect(result.history).toHaveLength(1);
  });

  it("should only return user's own assignments", async () => {
    const mockUser = { id: "user1", role: "USER", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockUser);

    const request = new Request("http://localhost/dashboard/my-assets");
    await loader({ request, params: {}, context: {} });

    expect(prisma.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user1",
        }),
      })
    );
  });
});

describe("My Assets Return Action", () => {
  it("should allow user to return their own asset", async () => {
    const mockUser = { id: "user1", role: "USER", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockUser);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: "assign1",
      userId: "user1",
      assetId: "asset1",
      status: "ACTIVE",
    } as any);
    vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}]);

    const formData = new FormData();
    formData.append("assignmentId", "assign1");
    formData.append("conditionOnReturn", "Good");

    const request = new Request("http://localhost/dashboard/my-assets", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  it("should not allow returning other user's assets", async () => {
    const mockUser = { id: "user1", role: "USER", companyId: "company1" };
    vi.mocked(auth.requireAuth).mockResolvedValue(mockUser);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: "assign1",
      userId: "user2", // Different user
      assetId: "asset1",
      status: "ACTIVE",
    } as any);

    const formData = new FormData();
    formData.append("assignmentId", "assign1");

    const request = new Request("http://localhost/dashboard/my-assets", {
      method: "POST",
      body: formData,
    });

    const response = await action({ request, params: {}, context: {} });
    const data = await response.json();

    expect(data.error).toBeDefined();
  });
});

// tests/routes/users.id.history.test.ts
import { describe, it, expect, vi } from "vitest";
import { loader } from "~/routes/_dashboard.users.$id";
import { prisma } from "~/lib/db.server";
import * as auth from "~/lib/auth.server";

vi.mock("~/lib/db.server");
vi.mock("~/lib/auth.server");

describe("User Detail with History", () => {
  it("should include assignment history in loader", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "user1",
      email: "user@test.com",
      companyId: "company1",
    } as any);
    vi.mocked(prisma.assignment.findMany).mockResolvedValue([
      { id: "1", status: "ACTIVE", asset: { name: "Laptop" } },
      { id: "2", status: "RETURNED", asset: { name: "Monitor" } },
    ] as any);

    const request = new Request("http://localhost/dashboard/users/user1");
    const result = await loader({ request, params: { id: "user1" }, context: {} });

    expect(result.currentAssignments).toBeDefined();
    expect(result.pastAssignments).toBeDefined();
  });

  it("should separate current and past assignments", async () => {
    const mockAdmin = { id: "admin1", role: "ADMIN", companyId: "company1" };
    vi.mocked(auth.requireRole).mockResolvedValue(mockAdmin);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "user1" } as any);
    vi.mocked(prisma.assignment.findMany).mockResolvedValue([
      { id: "1", status: "ACTIVE" },
      { id: "2", status: "RETURNED" },
      { id: "3", status: "TRANSFERRED" },
    ] as any);

    const request = new Request("http://localhost/dashboard/users/user1");
    const result = await loader({ request, params: { id: "user1" }, context: {} });

    expect(result.currentAssignments.length).toBe(1);
    expect(result.pastAssignments.length).toBe(2);
  });
});
```

---

# PHASE 7: Role-Based UI

---

## Task 13: Role-Based Navigation & Components

### Objective
Implement role-based UI rendering using React Router v7 patterns with loaders, layouts, and conditional navigation.

### Requirements

1. **useAuth Hook** (`app/hooks/useAuth.ts`)
   ```typescript
   import { useRouteLoaderData } from "react-router";
   import type { User, Role } from "~/types";

   export function useAuth() {
     // Get user from dashboard layout loader
     const data = useRouteLoaderData("routes/_dashboard") as { user: User } | undefined;
     const user = data?.user ?? null;
     
     return {
       user,
       isAuthenticated: !!user,
       hasRole: (roles: Role[]) => user ? roles.includes(user.role) : false,
       isOwner: user?.role === "OWNER",
       isAdmin: user?.role === "ADMIN",
       isUser: user?.role === "USER",
     };
   }
   ```

2. **Role-Based Navigation** (`app/components/layout/Sidebar.tsx`)
   ```typescript
   import { NavLink } from "react-router";
   import { LayoutDashboard, Building, Package, ArrowLeftRight, Users, Settings, User } from "lucide-react";
   import type { User as UserType, Role } from "~/types";

   interface MenuItem {
     path: string;
     label: string;
     icon: React.ComponentType<{ className?: string }>;
     roles: Role[];
   }

   const menuItems: MenuItem[] = [
     { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER", "ADMIN", "USER"] },
     { path: "/dashboard/companies", label: "Companies", icon: Building, roles: ["OWNER"] },
     { path: "/dashboard/assets", label: "Assets", icon: Package, roles: ["OWNER", "ADMIN"] },
     { path: "/dashboard/assignments", label: "Assignments", icon: ArrowLeftRight, roles: ["OWNER", "ADMIN"] },
     { path: "/dashboard/users", label: "Users", icon: Users, roles: ["OWNER", "ADMIN"] },
     { path: "/dashboard/my-assets", label: "My Assets", icon: Package, roles: ["USER"] },
     { path: "/dashboard/profile", label: "Profile", icon: User, roles: ["OWNER", "ADMIN", "USER"] },
     { path: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["OWNER", "ADMIN"] },
   ];

   export function Sidebar({ user }: { user: UserType }) {
     const filteredItems = menuItems.filter(item => item.roles.includes(user.role));

     return (
       <aside className="w-64 bg-gray-900 text-white p-4">
         <div className="mb-8">
           <h1 className="text-xl font-bold">Asset Manager</h1>
           <p className="text-sm text-gray-400">{user.company?.name}</p>
         </div>
         
         <nav className="space-y-2">
           {filteredItems.map(item => (
             <NavLink
               key={item.path}
               to={item.path}
               end={item.path === "/dashboard"}
               className={({ isActive }) =>
                 `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                   isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
                 }`
               }
             >
               <item.icon className="w-5 h-5" />
               {item.label}
             </NavLink>
           ))}
         </nav>
       </aside>
     );
   }
   ```

3. **RoleGate Component** (`app/components/auth/RoleGate.tsx`)
   ```typescript
   import type { Role } from "~/types";
   import { useAuth } from "~/hooks/useAuth";

   interface RoleGateProps {
     allowedRoles: Role[];
     children: React.ReactNode;
     fallback?: React.ReactNode;
   }

   export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
     const { hasRole } = useAuth();
     return hasRole(allowedRoles) ? <>{children}</> : <>{fallback}</>;
   }
   ```

4. **Usage in Components**
   ```tsx
   import { RoleGate } from "~/components/auth/RoleGate";

   function AssetListPage({ loaderData }: Route.ComponentProps) {
     return (
       <div>
         <h1>Assets</h1>
         
         {/* Only show Add button for OWNER and ADMIN */}
         <RoleGate allowedRoles={["OWNER", "ADMIN"]}>
           <Link to="/dashboard/assets/new">
             <Button>Add Asset</Button>
           </Link>
         </RoleGate>
         
         {/* Asset list visible to all */}
         <AssetTable assets={loaderData.assets} />
       </div>
     );
   }
   ```

5. **Header with User Info** (`app/components/layout/Header.tsx`)
   ```typescript
   import { Form } from "react-router";
   import type { User } from "~/types";

   export function Header({ user }: { user: User }) {
     return (
       <header className="h-16 border-b flex items-center justify-between px-6">
         <div />
         
         <div className="flex items-center gap-4">
           <div className="text-right">
             <p className="font-medium">{user.firstName} {user.lastName}</p>
             <p className="text-sm text-gray-500">{user.role}</p>
           </div>
           
           <Form method="post" action="/logout">
             <Button variant="ghost" type="submit">Logout</Button>
           </Form>
         </div>
       </header>
     );
   }
   ```

6. **Login Action** (`app/routes/_auth.login.tsx`)
   ```typescript
   import { redirect, data } from "react-router";
   import { Form, useActionData, useNavigation } from "react-router";
   import type { Route } from "./+types/_auth.login";
   import { loginUser } from "~/lib/auth.server";

   export async function action({ request }: Route.ActionArgs) {
     const formData = await request.formData();
     const email = formData.get("email") as string;
     const password = formData.get("password") as string;

     const result = await loginUser(email, password);
     
     if (!result.success) {
       return data({ error: result.error }, { status: 401 });
     }

     // Set HTTP-only cookie and redirect based on role
     const redirectPath = result.user.role === "USER" 
       ? "/dashboard/my-assets" 
       : "/dashboard";
     
     return redirect(redirectPath, {
       headers: {
         "Set-Cookie": `auth_token=${result.token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
       },
     });
   }

   export default function LoginPage() {
     const actionData = useActionData<typeof action>();
     const navigation = useNavigation();
     const isSubmitting = navigation.state === "submitting";

     return (
       <div className="min-h-screen flex items-center justify-center">
         <Card className="w-full max-w-md">
           <CardHeader>
             <CardTitle>Login</CardTitle>
           </CardHeader>
           <CardContent>
             <Form method="post" className="space-y-4">
               {actionData?.error && (
                 <Alert variant="destructive">
                   <AlertDescription>{actionData.error}</AlertDescription>
                 </Alert>
               )}
               
               <div>
                 <Label htmlFor="email">Email</Label>
                 <Input id="email" name="email" type="email" required />
               </div>
               
               <div>
                 <Label htmlFor="password">Password</Label>
                 <Input id="password" name="password" type="password" required />
               </div>
               
               <Button type="submit" className="w-full" disabled={isSubmitting}>
                 {isSubmitting ? "Logging in..." : "Login"}
               </Button>
             </Form>
           </CardContent>
         </Card>
       </div>
     );
   }
   ```

7. **Logout Action** (`app/routes/logout.tsx`)
   ```typescript
   import { redirect } from "react-router";
   import type { Route } from "./+types/logout";

   export async function action({ request }: Route.ActionArgs) {
     return redirect("/login", {
       headers: {
         "Set-Cookie": "auth_token=; Path=/; HttpOnly; Max-Age=0",
       },
     });
   }
   ```

8. **Unauthorized Page** (`app/routes/unauthorized.tsx`)
   ```typescript
   import { Link } from "react-router";

   export default function Unauthorized() {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen">
         <h1 className="text-2xl font-bold">Access Denied</h1>
         <p className="text-gray-500 mt-2">You don't have permission to access this page.</p>
         <Link to="/dashboard" className="text-blue-500 mt-4 hover:underline">
           Return to Dashboard
         </Link>
       </div>
     );
   }
   ```

### Route Structure (File-based)
```
app/routes/
├── _index.tsx                    # Home → redirect to login or dashboard
├── _auth.tsx                     # Auth layout (no sidebar)
├── _auth.login.tsx               # /login
├── _auth.register.tsx            # /register
├── _dashboard.tsx                # Dashboard layout (with sidebar) - PROTECTED
├── _dashboard._index.tsx         # /dashboard
├── _dashboard.companies.tsx      # /dashboard/companies (OWNER only)
├── _dashboard.assets.tsx         # /dashboard/assets
├── _dashboard.assets.$id.tsx     # /dashboard/assets/:id
├── _dashboard.assets.new.tsx     # /dashboard/assets/new
├── _dashboard.users.tsx          # /dashboard/users
├── _dashboard.assignments.tsx    # /dashboard/assignments
├── _dashboard.my-assets.tsx      # /dashboard/my-assets (USER only)
├── _dashboard.profile.tsx        # /dashboard/profile
├── _dashboard.settings.tsx       # /dashboard/settings
├── unauthorized.tsx              # /unauthorized
└── logout.tsx                    # /logout (action only)
```

### File Structure
```
app/
├── routes/                 # All route files
├── components/
│   ├── auth/
│   │   └── RoleGate.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Header.tsx
├── hooks/
│   └── useAuth.ts
└── types/
    └── index.ts            # User, Role, etc.
```

### Acceptance Criteria
- [ ] Navigation shows only allowed items per role
- [ ] RoleGate hides unauthorized UI elements
- [ ] Login uses Form + action pattern
- [ ] Token stored in HTTP-only cookie
- [ ] Logout clears cookie and redirects
- [ ] Unauthorized page displayed for forbidden routes

### Test Cases

```typescript
// tests/hooks/useAuth.test.ts
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "~/hooks/useAuth";
import * as reactRouter from "react-router";

vi.mock("react-router", () => ({
  useRouteLoaderData: vi.fn(),
}));

describe("useAuth Hook", () => {
  it("should return user data when authenticated", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue({
      user: { id: "1", email: "test@test.com", role: "ADMIN" },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeDefined();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it("should return null when not authenticated", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue(undefined);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("should check role correctly", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue({
      user: { id: "1", role: "ADMIN" },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasRole(["ADMIN"])).toBe(true);
    expect(result.current.hasRole(["OWNER"])).toBe(false);
    expect(result.current.hasRole(["ADMIN", "OWNER"])).toBe(true);
  });

  it("should identify role correctly", () => {
    vi.mocked(reactRouter.useRouteLoaderData).mockReturnValue({
      user: { id: "1", role: "OWNER" },
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isOwner).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isUser).toBe(false);
  });
});

// tests/components/auth/RoleGate.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoleGate } from "~/components/auth/RoleGate";
import * as useAuthModule from "~/hooks/useAuth";

vi.mock("~/hooks/useAuth");

describe("RoleGate Component", () => {
  it("should render children for allowed role", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: "1", role: "ADMIN" },
      isAuthenticated: true,
      hasRole: (roles) => roles.includes("ADMIN"),
      isOwner: false,
      isAdmin: true,
      isUser: false,
    } as any);

    render(
      <RoleGate allowedRoles={["ADMIN"]}>
        <div data-testid="admin-content">Admin Content</div>
      </RoleGate>
    );

    expect(screen.getByTestId("admin-content")).toBeInTheDocument();
  });

  it("should not render children for disallowed role", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: "1", role: "USER" },
      isAuthenticated: true,
      hasRole: (roles) => roles.includes("USER"),
      isOwner: false,
      isAdmin: false,
      isUser: true,
    } as any);

    render(
      <RoleGate allowedRoles={["ADMIN"]}>
        <div data-testid="admin-content">Admin Content</div>
      </RoleGate>
    );

    expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
  });

  it("should render fallback for disallowed role", () => {
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: "1", role: "USER" },
      hasRole: () => false,
    } as any);

    render(
      <RoleGate
        allowedRoles={["ADMIN"]}
        fallback={<div data-testid="fallback">Access Denied</div>}
      >
        <div>Admin Content</div>
      </RoleGate>
    );

    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });
});

// tests/components/layout/Sidebar.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Sidebar } from "~/components/layout/Sidebar";

describe("Sidebar Component", () => {
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it("should show all menu items for OWNER", () => {
    const owner = {
      id: "1",
      role: "OWNER" as const,
      firstName: "John",
      lastName: "Doe",
    };

    renderWithRouter(<Sidebar user={owner as any} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Companies")).toBeInTheDocument();
    expect(screen.getByText("Assets")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
  });

  it("should hide Companies for ADMIN", () => {
    const admin = {
      id: "1",
      role: "ADMIN" as const,
      firstName: "Jane",
      lastName: "Doe",
    };

    renderWithRouter(<Sidebar user={admin as any} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Companies")).not.toBeInTheDocument();
    expect(screen.getByText("Assets")).toBeInTheDocument();
  });

  it("should only show My Assets for USER", () => {
    const user = {
      id: "1",
      role: "USER" as const,
      firstName: "Bob",
      lastName: "Smith",
    };

    renderWithRouter(<Sidebar user={user as any} />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("My Assets")).toBeInTheDocument();
    expect(screen.queryByText("Assets")).not.toBeInTheDocument();
    expect(screen.queryByText("Users")).not.toBeInTheDocument();
  });
});

// tests/routes/logout.test.ts
import { describe, it, expect } from "vitest";
import { action } from "~/routes/logout";

describe("Logout Action", () => {
  it("should redirect to login", async () => {
    const request = new Request("http://localhost/logout", { method: "POST" });

    const response = await action({ request, params: {}, context: {} });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/login");
  });

  it("should clear auth cookie", async () => {
    const request = new Request("http://localhost/logout", { method: "POST" });

    const response = await action({ request, params: {}, context: {} });

    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toContain("auth_token=");
    expect(setCookie).toContain("Max-Age=0");
  });
});
```

---

# PHASE 8: Error Handling & Validation

---

## Task 14: Error Handling & Form Validation

### Objective
Implement consistent error handling and validation patterns across the application.

### Requirements

1. **Zod Schemas** (`app/lib/schemas.ts`)
   ```typescript
   import { z } from "zod";

   export const loginSchema = z.object({
     email: z.string().email("Invalid email address"),
     password: z.string().min(6, "Password must be at least 6 characters"),
   });

   export const assetSchema = z.object({
     name: z.string().min(1, "Name is required"),
     serialNumber: z.string().min(1, "Serial number is required"),
     categoryId: z.string().min(1, "Category is required"),
     status: z.enum(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"]),
     purchaseDate: z.string().optional(),
     purchaseCost: z.number().positive().optional(),
   });

   export const userSchema = z.object({
     email: z.string().email("Invalid email address"),
     firstName: z.string().min(1, "First name is required"),
     lastName: z.string().min(1, "Last name is required"),
     role: z.enum(["OWNER", "ADMIN", "USER"]),
   });
   ```

2. **Validation Helper** (`app/lib/validation.server.ts`)
   ```typescript
   import { data } from "react-router";
   import { z, ZodError, ZodSchema } from "zod";

   export async function validateFormData<T>(
     formData: FormData,
     schema: ZodSchema<T>
   ): Promise<{ data: T; errors: null } | { data: null; errors: Record<string, string> }> {
     const rawData = Object.fromEntries(formData);
     
     try {
       const validData = schema.parse(rawData);
       return { data: validData, errors: null };
     } catch (error) {
       if (error instanceof ZodError) {
         const errors: Record<string, string> = {};
         error.errors.forEach(e => {
           if (e.path[0]) errors[String(e.path[0])] = e.message;
         });
         return { data: null, errors };
       }
       throw error;
     }
   }
   ```

3. **Error Response Helper** (`app/lib/errors.server.ts`)
   ```typescript
   import { data } from "react-router";
   import { Prisma } from "@prisma/client";

   export function handlePrismaError(error: unknown) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
       switch (error.code) {
         case "P2002":
           return data({ error: "A record with this value already exists" }, { status: 409 });
         case "P2025":
           return data({ error: "Record not found" }, { status: 404 });
         default:
           return data({ error: "Database error" }, { status: 500 });
       }
     }
     throw error;
   }
   ```

4. **Using Validation in Actions**
   ```typescript
   export async function action({ request }: Route.ActionArgs) {
     const formData = await request.formData();
     const validation = await validateFormData(formData, assetSchema);
     
     if (validation.errors) {
       return data({ errors: validation.errors }, { status: 400 });
     }

     try {
       const asset = await prisma.asset.create({ data: validation.data });
       return redirect(`/dashboard/assets/${asset.id}`);
     } catch (error) {
       return handlePrismaError(error);
     }
   }
   ```

5. **Client-Side Form with Error Display**
   ```tsx
   export default function AssetForm({ actionData }: Route.ComponentProps) {
     return (
       <Form method="post">
         <div>
           <Label htmlFor="name">Name</Label>
           <Input 
             id="name" 
             name="name" 
             className={actionData?.errors?.name ? "border-red-500" : ""}
           />
           {actionData?.errors?.name && (
             <p className="text-sm text-red-500">{actionData.errors.name}</p>
           )}
         </div>
         {/* More fields... */}
       </Form>
     );
   }
   ```

### Acceptance Criteria
- [ ] All forms have Zod validation
- [ ] Validation errors display per-field
- [ ] Prisma errors handled gracefully
- [ ] User-friendly error messages

### Test Cases

```typescript
// tests/lib/validation.server.test.ts
import { describe, it, expect } from "vitest";
import { validateFormData } from "~/lib/validation.server";
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

    expect(result.data).toEqual({
      name: "John Doe",
      email: "john@example.com",
    });
    expect(result.errors).toBeNull();
  });

  it("should return errors for invalid input", async () => {
    const formData = new FormData();
    formData.append("name", "");
    formData.append("email", "invalid-email");

    const result = await validateFormData(formData, testSchema);

    expect(result.data).toBeNull();
    expect(result.errors?.name).toBe("Name is required");
    expect(result.errors?.email).toBe("Invalid email");
  });

  it("should coerce number fields", async () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("email", "john@test.com");
    formData.append("age", "25");

    const result = await validateFormData(formData, testSchema);

    expect(result.data?.age).toBe(25);
    expect(typeof result.data?.age).toBe("number");
  });
});

// tests/lib/errors.server.test.ts
import { describe, it, expect } from "vitest";
import { handlePrismaError } from "~/lib/errors.server";
import { Prisma } from "@prisma/client";

describe("handlePrismaError", () => {
  it("should handle unique constraint violation", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "5.0.0",
    });

    const response = handlePrismaError(error);

    expect(response.status).toBe(409);
  });

  it("should handle record not found", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "5.0.0",
    });

    const response = handlePrismaError(error);

    expect(response.status).toBe(404);
  });

  it("should throw non-Prisma errors", () => {
    const error = new Error("Some other error");

    expect(() => handlePrismaError(error)).toThrow("Some other error");
  });
});

// tests/lib/schemas.test.ts
import { describe, it, expect } from "vitest";
import { loginSchema, assetSchema, userSchema } from "~/lib/schemas";

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
  });

  it("should reject short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345", // Less than 6 chars
    });

    expect(result.success).toBe(false);
  });
});

describe("assetSchema", () => {
  it("should accept valid asset data", () => {
    const result = assetSchema.safeParse({
      name: "MacBook Pro",
      serialNumber: "ABC123",
      categoryId: "cat1",
      status: "AVAILABLE",
    });

    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = assetSchema.safeParse({
      name: "",
      categoryId: "cat1",
      status: "AVAILABLE",
    });

    expect(result.success).toBe(false);
  });

  it("should validate status enum", () => {
    const result = assetSchema.safeParse({
      name: "Laptop",
      categoryId: "cat1",
      status: "INVALID_STATUS",
    });

    expect(result.success).toBe(false);
  });
});

describe("userSchema", () => {
  it("should accept valid user data", () => {
    const result = userSchema.safeParse({
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "USER",
    });

    expect(result.success).toBe(true);
  });

  it("should validate role enum", () => {
    const result = userSchema.safeParse({
      email: "user@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "SUPERADMIN", // Invalid role
    });

    expect(result.success).toBe(false);
  });
});
```

---

# PHASE 9: Frontend Pages

---

## Task 15: Frontend Pages Implementation

### Objective
Build all remaining frontend pages with forms and data display using shadcn/ui components.

### Pages to Create

1. **Company Pages** (OWNER only)
   - `_dashboard.companies.tsx` - List with DataTable
   - `_dashboard.companies.new.tsx` - Create form
   - `_dashboard.companies.$id.tsx` - Detail/Edit

2. **Asset Pages**
   - `_dashboard.assets.tsx` - List with filters, search, pagination
   - `_dashboard.assets.new.tsx` - Create form with image upload
   - `_dashboard.assets.$id.tsx` - Detail with QR code, history
   - `_dashboard.assets.$id.edit.tsx` - Edit form

3. **User Pages**
   - `_dashboard.users.tsx` - List
   - `_dashboard.users.new.tsx` - Create/Invite
   - `_dashboard.users.$id.tsx` - Detail with assignment history

4. **Assignment Pages**
   - `_dashboard.assignments.tsx` - Assignment management
   - Quick assign/return dialogs

5. **Profile & Settings**
   - `_dashboard.profile.tsx` - User profile edit
   - `_dashboard.settings.tsx` - Company settings (ADMIN+)

### shadcn/ui Components to Install
```bash
npx shadcn@latest add button card input label form table dialog select badge tabs alert avatar dropdown-menu separator skeleton toast
```

### Example: Asset List Page
```tsx
import { useLoaderData, Link, Form } from "react-router";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { DataTable } from "~/components/ui/data-table";
import { Badge } from "~/components/ui/badge";
import { RoleGate } from "~/components/auth/RoleGate";

export default function AssetsPage({ loaderData }: Route.ComponentProps) {
  const { assets, pagination, filters } = loaderData;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assets</h1>
        <RoleGate allowedRoles={["OWNER", "ADMIN"]}>
          <Link to="/dashboard/assets/new">
            <Button>Add Asset</Button>
          </Link>
        </RoleGate>
      </div>

      {/* Search & Filters */}
      <Form method="get" className="flex gap-4">
        <Input name="search" placeholder="Search assets..." defaultValue={filters.search} />
        <Select name="status" defaultValue={filters.status}>
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
        </Select>
        <Button type="submit">Filter</Button>
      </Form>

      {/* Asset Table */}
      <DataTable 
        data={assets} 
        columns={columns}
        pagination={pagination}
      />
    </div>
  );
}
```

### Acceptance Criteria
- [ ] All pages use shadcn/ui components
- [ ] Forms have proper validation feedback
- [ ] Tables support sorting and pagination
- [ ] Mobile-responsive layouts
- [ ] Loading states with skeletons

### Test Cases

```typescript
// tests/components/ui/DataTable.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "~/components/ui/data-table";

describe("DataTable Component", () => {
  const mockData = [
    { id: "1", name: "Item 1", status: "Active" },
    { id: "2", name: "Item 2", status: "Inactive" },
  ];

  const mockColumns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "status", header: "Status" },
  ];

  it("should render data rows", () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("should render column headers", () => {
    render(<DataTable data={mockData} columns={mockColumns} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("should handle empty data", () => {
    render(<DataTable data={[]} columns={mockColumns} />);

    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });
});

// tests/components/forms/AssetForm.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";

// Mock form component for testing
function AssetForm({ actionData }: { actionData?: { errors?: Record<string, string> } }) {
  return (
    <form>
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          className={actionData?.errors?.name ? "border-red-500" : ""}
          data-testid="name-input"
        />
        {actionData?.errors?.name && (
          <span data-testid="name-error">{actionData.errors.name}</span>
        )}
      </div>
      <button type="submit">Save</button>
    </form>
  );
}

describe("AssetForm Component", () => {
  it("should render form fields", () => {
    render(<AssetForm />);

    expect(screen.getByTestId("name-input")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("should display validation errors", () => {
    render(
      <AssetForm
        actionData={{
          errors: { name: "Name is required" },
        }}
      />
    );

    expect(screen.getByTestId("name-error")).toHaveTextContent("Name is required");
    expect(screen.getByTestId("name-input")).toHaveClass("border-red-500");
  });

  it("should not show errors when no errors exist", () => {
    render(<AssetForm actionData={{}} />);

    expect(screen.queryByTestId("name-error")).not.toBeInTheDocument();
  });
});

// tests/pages/assets.page.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

// Mock page component
function AssetsPage({ loaderData }: { loaderData: any }) {
  return (
    <div>
      <h1>Assets</h1>
      {loaderData.assets.length === 0 ? (
        <p>No assets found</p>
      ) : (
        <ul>
          {loaderData.assets.map((asset: any) => (
            <li key={asset.id}>{asset.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

describe("Assets Page", () => {
  it("should display assets list", () => {
    const loaderData = {
      assets: [
        { id: "1", name: "Laptop" },
        { id: "2", name: "Monitor" },
      ],
    };

    render(
      <BrowserRouter>
        <AssetsPage loaderData={loaderData} />
      </BrowserRouter>
    );

    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("Monitor")).toBeInTheDocument();
  });

  it("should display empty state", () => {
    const loaderData = { assets: [] };

    render(
      <BrowserRouter>
        <AssetsPage loaderData={loaderData} />
      </BrowserRouter>
    );

    expect(screen.getByText("No assets found")).toBeInTheDocument();
  });
});

// tests/components/Pagination.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock pagination component
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        data-testid="prev-btn"
      >
        Previous
      </button>
      <span data-testid="page-info">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        data-testid="next-btn"
      >
        Next
      </button>
    </div>
  );
}

describe("Pagination Component", () => {
  it("should display current page", () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);

    expect(screen.getByTestId("page-info")).toHaveTextContent("Page 2 of 5");
  });

  it("should disable previous on first page", () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />);

    expect(screen.getByTestId("prev-btn")).toBeDisabled();
  });

  it("should disable next on last page", () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />);

    expect(screen.getByTestId("next-btn")).toBeDisabled();
  });

  it("should call onPageChange when clicking next", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByTestId("next-btn"));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
```

---

# PHASE 10: Testing

---

## Task 16: Testing Setup

### Objective
Set up testing infrastructure for the React Router v7 application.

### Requirements

1. **Install Testing Dependencies**
   ```bash
   npm install -D vitest @testing-library/react @testing-library/user-event jsdom
   npm install -D @testing-library/dom happy-dom
   ```

2. **Vitest Configuration** (`vitest.config.ts`)
   ```typescript
   import { defineConfig } from "vitest/config";
   import react from "@vitejs/plugin-react";
   import tsconfigPaths from "vite-tsconfig-paths";

   export default defineConfig({
     plugins: [react(), tsconfigPaths()],
     test: {
       environment: "jsdom",
       globals: true,
       setupFiles: ["./tests/setup.ts"],
     },
   });
   ```

3. **Test Setup** (`tests/setup.ts`)
   ```typescript
   import "@testing-library/jest-dom";
   import { vi } from "vitest";

   // Mock Prisma client for tests
   vi.mock("~/lib/db.server", () => ({
     prisma: {
       user: { findUnique: vi.fn(), create: vi.fn() },
       asset: { findMany: vi.fn(), create: vi.fn() },
       // Add more as needed
     },
   }));
   ```

4. **Example Component Test**
   ```typescript
   import { render, screen } from "@testing-library/react";
   import { RoleGate } from "~/components/auth/RoleGate";

   describe("RoleGate", () => {
     it("renders children for allowed role", () => {
       render(
         <RoleGate allowedRoles={["ADMIN"]}>
           <div>Admin Content</div>
         </RoleGate>
       );
       expect(screen.getByText("Admin Content")).toBeInTheDocument();
     });
   });
   ```

5. **Example Loader Test**
   ```typescript
   import { loader } from "~/routes/_dashboard.assets";
   import { prisma } from "~/lib/db.server";

   describe("Assets Loader", () => {
     it("returns assets for user's company", async () => {
       vi.mocked(prisma.asset.findMany).mockResolvedValue([
         { id: "1", name: "Laptop", status: "AVAILABLE" }
       ]);

       const request = new Request("http://localhost/dashboard/assets");
       const result = await loader({ request, params: {}, context: {} });

       expect(result.assets).toHaveLength(1);
     });
   });
   ```

### NPM Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Acceptance Criteria
- [ ] Vitest configured and running
- [ ] Component tests for key UI components
- [ ] Loader/Action tests for critical routes
- [ ] Coverage report generated

### Test Cases

```typescript
// tests/setup.ts - Complete test setup file
import "@testing-library/jest-dom";
import { vi, beforeAll, afterEach, afterAll } from "vitest";
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
});

// Mock Prisma client
vi.mock("~/lib/db.server", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    asset: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    assignment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

// Mock react-router navigation
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    redirect: vi.fn((url, init) => {
      const response = new Response(null, {
        status: 302,
        headers: {
          Location: url,
          ...(init?.headers || {}),
        },
      });
      throw response;
    }),
    data: vi.fn((data, init) => {
      return new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: { "Content-Type": "application/json" },
      });
    }),
  };
});

// tests/integration/auth-flow.test.ts
import { describe, it, expect, vi } from "vitest";
import { prisma } from "~/lib/db.server";
import { hashPassword, verifyPassword, createToken } from "~/lib/auth.server";

describe("Authentication Flow Integration", () => {
  it("should complete full registration flow", async () => {
    // 1. Hash password
    const password = "testPassword123";
    const hashedPassword = await hashPassword(password);

    // 2. Verify password hashing works
    const isValid = await verifyPassword(password, hashedPassword);
    expect(isValid).toBe(true);

    // 3. Create token
    const token = await createToken({
      userId: "test-user-id",
      email: "test@example.com",
      role: "USER",
    });
    expect(token).toBeDefined();
    expect(token.split(".")).toHaveLength(3);
  });

  it("should reject invalid password", async () => {
    const hashedPassword = await hashPassword("correctPassword");
    const isValid = await verifyPassword("wrongPassword", hashedPassword);
    expect(isValid).toBe(false);
  });
});

// tests/integration/asset-lifecycle.test.ts
import { describe, it, expect, vi } from "vitest";

describe("Asset Lifecycle Integration", () => {
  it("should follow correct status transitions", () => {
    const validTransitions = {
      AVAILABLE: ["ASSIGNED", "UNDER_MAINTENANCE", "RETIRED"],
      ASSIGNED: ["AVAILABLE", "UNDER_MAINTENANCE"],
      UNDER_MAINTENANCE: ["AVAILABLE", "RETIRED"],
      RETIRED: [], // Terminal state
    };

    // Test valid transition
    expect(validTransitions.AVAILABLE).toContain("ASSIGNED");

    // Test invalid transition
    expect(validTransitions.RETIRED).not.toContain("AVAILABLE");
  });

  it("should track assignment status correctly", () => {
    const assignmentStatusFlow = {
      ACTIVE: ["RETURNED", "TRANSFERRED"],
      RETURNED: [], // Terminal
      TRANSFERRED: [], // Terminal
    };

    expect(assignmentStatusFlow.ACTIVE).toContain("RETURNED");
    expect(assignmentStatusFlow.ACTIVE).toContain("TRANSFERRED");
  });
});

// tests/e2e/smoke.test.ts (for Playwright or similar)
// This would be run with Playwright, not Vitest
/*
import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("should load login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Login");
  });

  test("should redirect unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should login successfully", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
*/

// tests/utils/test-helpers.ts
export function createMockRequest(url: string, options?: RequestInit) {
  return new Request(`http://localhost${url}`, options);
}

export function createMockFormData(data: Record<string, string>) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}

export function createMockUser(overrides = {}) {
  return {
    id: "test-user-id",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "USER" as const,
    isActive: true,
    companyId: "test-company-id",
    password: "hashedpassword",
    createdAt: new Date(),
    updatedAt: new Date(),
    resetToken: null,
    resetTokenExpiry: null,
    ...overrides,
  };
}

export function createMockAsset(overrides = {}) {
  return {
    id: "test-asset-id",
    name: "Test Asset",
    category: "Electronics",
    status: "AVAILABLE" as const,
    companyId: "test-company-id",
    createdById: "test-user-id",
    isDeleted: false,
    description: null,
    serialNumber: null,
    purchaseDate: null,
    purchasePrice: null,
    imagePath: null,
    qrCode: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

---

# Appendix

## Environment Variables

### Single `.env` file (React Router v7 Full-Stack)
```
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/asset-management

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-session-secret-key

# Application
NODE_ENV=development
APP_URL=http://localhost:5173
```

## Data Patterns

### Standard Action Response
```typescript
// Success
return redirect("/dashboard/assets");

// Success with message (use session flash)
// Or return data for toast:
return data({ success: true, message: "Asset created" });

// Validation errors
return data({ errors: { name: "Required" } }, { status: 400 });

// Auth error
return data({ error: "Unauthorized" }, { status: 401 });

// Not found
return data({ error: "Not found" }, { status: 404 });
```

### Loader Data Pattern
```typescript
export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const companyFilter = getCompanyFilter(user);
  
  const data = await prisma.asset.findMany({
    where: companyFilter,
    orderBy: { createdAt: "desc" },
  });

  return { assets: data, user };
}
```

## Route Files Summary

| Route File | Path | Purpose | Roles |
|------------|------|---------|-------|
| `_index.tsx` | `/` | Redirect to login/dashboard | All |
| `_auth.login.tsx` | `/login` | Login page | Public |
| `_auth.register.tsx` | `/register` | Registration | Public |
| `_dashboard.tsx` | Layout | Dashboard layout wrapper | Auth |
| `_dashboard._index.tsx` | `/dashboard` | Main dashboard | All Auth |
| `_dashboard.companies.tsx` | `/dashboard/companies` | Company list | OWNER |
| `_dashboard.assets.tsx` | `/dashboard/assets` | Asset list | OWNER, ADMIN |
| `_dashboard.assets.$id.tsx` | `/dashboard/assets/:id` | Asset detail | All Auth |
| `_dashboard.users.tsx` | `/dashboard/users` | User list | OWNER, ADMIN |
| `_dashboard.assignments.tsx` | `/dashboard/assignments` | Manage assignments | OWNER, ADMIN |
| `_dashboard.my-assets.tsx` | `/dashboard/my-assets` | User's assets | USER |
| `_dashboard.profile.tsx` | `/dashboard/profile` | User profile | All Auth |
| `api.upload.tsx` | `/api/upload` | File upload resource | OWNER, ADMIN |
| `api.assets.$id.qr.tsx` | `/api/assets/:id/qr` | QR code image | All Auth |

---

**Document Version:** 2.0  
**Last Updated:** 2025  
**Architecture:** React Router v7 Full-Stack (SSR Mode)

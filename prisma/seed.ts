import { PrismaClient, Role, AssetStatus, AssignmentStatus, OwnershipType } from "@prisma/client";
import bcrypt from "bcryptjs";
import seedData from "../defaultvalue/seed-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed from seed-data.ts...");

  // Clear existing data in reverse order of dependencies
  await prisma.assignment.deleteMany();
  console.log("🗑️  Cleared Assignments");
  await prisma.asset.deleteMany();
  console.log("🗑️  Cleared Assets");
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared Users");
  await prisma.company.deleteMany();
  console.log("🗑️  Cleared Companies");

  const { Companies, User, Assets, Assignment } = seedData;

  console.log(`📦 Found ${Companies.length} companies, ${User.length} users, ${Assets.length} assets, and ${Assignment.length} assignments.`);

  // 1. Seed Companies
  console.log("🏢 Seeding Companies...");
  for (const c of Companies) {
    await prisma.company.create({
      data: {
        id: c._id.$oid,
        name: c.name,
        address: c.address,
        phone: c.phone,
        email: c.email,
        website: c.website,
        description: c.description,
        isActive: c.isActive,
        ownerId: c.ownerId.$oid,
        createdAt: new Date(c.createdAt.$date),
        updatedAt: new Date(c.updatedAt.$date),
      },
    });
  }

  // 2. Seed Users
  console.log("👤 Seeding Users and hashing passwords...");
  for (const u of User) {
    let password = "password123"; // default fallback

    // Special password logic for Snapdevio
    const isSnapdevio = u.email.endsWith("@snapdevio.com") || u.email === "chintandhokai97@gmail.com";
    if (isSnapdevio) {
      if (u.role === "OWNER" || u.role === "ADMIN") {
        password = "password123";
      } else {
        password = `${u.firstName.toLowerCase()}@snapdevio406`;
      }
    } else {
      password = "password123";
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        id: u._id.$oid,
        email: u.email,
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role as Role,
        isActive: u.isActive,
        companyId: u.companyId?.$oid,
        createdAt: new Date(u.createdAt.$date),
        updatedAt: new Date(u.updatedAt.$date),
      },
    });
  }

  // 3. Seed Assets
  console.log("💻 Seeding Assets...");
  for (const a of Assets) {
    await prisma.asset.create({
      data: {
        id: a._id.$oid,
        name: a.name,
        description: a.description,
        serialNumber: a.serialNumber,
        model: a.model,
        manufacturer: a.manufacturer,
        purchaseDate: a.purchaseDate?.$date ? new Date(a.purchaseDate.$date) : null,
        purchasePrice: a.purchasePrice,
        currentValue: a.currentValue,
        location: a.location,
        status: a.status as AssetStatus,
        category: a.category,
        tags: a.tags || [],
        ownershipType: a.ownershipType as OwnershipType,
        companyId: a.companyId.$oid,
        createdById: a.createdById.$oid,
        ownerId: a.ownerId?.$oid,
        otherOwnership: a.otherOwnership,
        createdAt: new Date(a.createdAt.$date),
        updatedAt: new Date(a.updatedAt.$date),
      },
    });
  }

  // 4. Seed Assignments
  console.log("📋 Seeding Assignments...");
  for (const asgn of Assignment) {
    await prisma.assignment.create({
      data: {
        id: asgn._id.$oid,
        assetId: asgn.assetId.$oid,
        userId: asgn.userId.$oid,
        assignedDate: new Date(asgn.assignedDate.$date),
        dueDate: asgn.dueDate?.$date ? new Date(asgn.dueDate.$date) : (asgn.dueDate ? new Date(asgn.dueDate as any) : null),
        returnDate: asgn.returnDate?.$date ? new Date(asgn.returnDate.$date) : (asgn.returnDate ? new Date(asgn.returnDate as any) : null),
        notes: asgn.notes,
        status: asgn.status as AssignmentStatus,
        createdAt: new Date(asgn.createdAt.$date),
        updatedAt: new Date(asgn.updatedAt.$date),
      },
    });
  }

  console.log("🏢 Created Snapdevio and TechCorp with users and assets");

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("- Companies: 2 (Snapdevio, TechCorp Solutions)");
  console.log("- Snapdevio Users: 36 (1 Owner, 2 Admins, 33 Users)");
  console.log("- TechCorp Users: 5 (1 Owner, 1 Admin, 3 Users)");
  console.log("- Snapdevio Assets: ~180+ (individual assets with assignments)");
  console.log("- TechCorp Assets: 10");
  console.log("\n🔑 Login credentials:");
  console.log("Snapdevio:");
  console.log("  - Owner/Admin: password123");
  console.log("  - Users: firstname@snapdevio406 (e.g., jayendra@snapdevio406)");
  console.log("TechCorp:");
  console.log("  - All users: password123");
  console.log("\n👤 Sample users:");
  console.log("Snapdevio:");
  console.log("- Owner: owner@snapdevio.com");
  console.log("- Admin: admin@snapdevio.com");
  console.log("- User: jayendra.ramani@snapdevio.com (password: jayendra@snapdevio406)");
  console.log("TechCorp:");
  console.log("- Owner: owner@techcorp.com");
  console.log("- Admin: admin@techcorp.com");
  console.log("- User: mike.chen@techcorp.com");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

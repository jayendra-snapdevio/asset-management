import { PrismaClient, Role, AssetStatus, AssignmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.assignment.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log("🗑️  Cleared existing data");

  // Hash password for all users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // ============================================
  // COMPANY 1: SNAPDEVIO
  // ============================================
  const snapdevio = await prisma.company.create({
    data: {
      name: "Snapdevio",
      address: "B-406,407, Sicilia Business Hub, Mota Varachha, Surat-394101, Gujarat, India",
      phone: "+91 98797 64363",
      email: "hello@snapdevio.com",
      website: "https://www.snapdevio.com",
      description: "Leading technology solutions provider specializing in enterprise software and hardware.",
      isActive: true,
      ownerId: "000000000000000000000000", // Placeholder, will be updated
    },
  });

  // Snapdevio users data
  const snapdevioUsersData = [
    { email: "owner@snapdevio.com", firstName: "Owner", lastName: "Snapdevio", role: Role.OWNER },
    { email: "admin@snapdevio.com", firstName: "Admin", lastName: "Snapdevio", role: Role.ADMIN },
    { email: "jayendra.ramani@snapdevio.com", firstName: "Jayendra", lastName: "Ramani", role: Role.USER },
    { email: "chintandhokai97@gmail.com", firstName: "Chintan", lastName: "Dhokai", role: Role.USER },
    { email: "devang.patel@snapdevio.com", firstName: "Devang", lastName: "Patel", role: Role.USER },
    { email: "bhavesh.patel@snapdevio.com", firstName: "Bhavesh", lastName: "Patel", role: Role.USER },
    { email: "abhay.gaudani@snapdevio.com", firstName: "Abhay", lastName: "Gaudani", role: Role.USER },
    { email: "devarshi.savaliya@snapdevio.com", firstName: "Devarshi", lastName: "Savaliya", role: Role.USER },
    { email: "paras.devaliya@snapdevio.com", firstName: "Paras", lastName: "Devaliya", role: Role.USER },
    { email: "dhvanil.soladhra@snapdevio.com", firstName: "Dhvanil", lastName: "Soladhra", role: Role.USER },
    { email: "training+meet@snapdevio.com", firstName: "Meet", lastName: "Sheladiya", role: Role.USER },
    { email: "krina.kumbhani@snapdevio.com", firstName: "Krina", lastName: "Kumbhani", role: Role.USER },
    { email: "raj.dhokai@snapdevio.com", firstName: "Raj", lastName: "Dhokai", role: Role.USER },
    { email: "diya.ghelani@snapdevio.com", firstName: "Diya", lastName: "Ghelani", role: Role.USER },
    { email: "divyang.bhadani@snapdevio.com", firstName: "Divyang", lastName: "Bhadani", role: Role.USER },
    { email: "dhruti.hirapara@snapdevio.com", firstName: "Dhruti", lastName: "Hirapara", role: Role.USER },
    { email: "dilip.jasoliya@snapdevio.com", firstName: "Dilip", lastName: "Jasoliya", role: Role.USER },
    { email: "dhruvi.tagadiya@snapdevio.com", firstName: "Dhruvi", lastName: "Tagadiya", role: Role.USER },
    { email: "nishank.radadiya@snapdevio.com", firstName: "Nishank", lastName: "Radadiya", role: Role.USER },
    { email: "training+vanshita@snapdevio.com", firstName: "Vanshita", lastName: "Nakrani", role: Role.USER },
    { email: "meghna.tandel@snapdevio.com", firstName: "Meghna", lastName: "Tandel", role: Role.USER },
    { email: "fensi.kotadiya@snapdevio.com", firstName: "Fensi", lastName: "Kotadiya", role: Role.USER },
    { email: "krutika.lakhani@snapdevio.com", firstName: "Krutika", lastName: "Lakhani", role: Role.USER },
    { email: "khushbu.pambhar@snapdevio.com", firstName: "Khushbu", lastName: "Pambhar", role: Role.USER },
    { email: "kaushik.gaudani@snapdevio.com", firstName: "Kaushik", lastName: "Gaudani", role: Role.USER },
    { email: "priyanka.dudhat@snapdevio.com", firstName: "Priyanka", lastName: "Dudhat", role: Role.USER },
    { email: "prachi.jayani@snapdevio.com", firstName: "Prachi", lastName: "Jayani", role: Role.USER },
    { email: "princy.karkar@snapdevio.com", firstName: "Princy", lastName: "Karkar", role: Role.USER },
    { email: "jenish.bhadani@snapdevio.com", firstName: "Jenish", lastName: "Bhadani", role: Role.USER },
    { email: "chirag.chovatiya@snapdevio.com", firstName: "Chirag", lastName: "Chovatiya", role: Role.USER },
    { email: "saharsh.rathod@snapdevio.com", firstName: "Saharsh", lastName: "Rathod", role: Role.USER },
    { email: "gaurav.malviya@snapdevio.com", firstName: "Gaurav", lastName: "Malviya", role: Role.USER },
    { email: "shivang.dave@snapdevio.com", firstName: "Shivang", lastName: "Dave", role: Role.USER },
    { email: "rakesh.gosalia@snapdevio.com", firstName: "Rakesh", lastName: "Gosalia", role: Role.USER },
    { email: "dhruvi.italiya@snapdevio.com", firstName: "Dhruvi", lastName: "Italiya", role: Role.USER },
  ];

  // Create all Snapdevio users
  await prisma.user.createMany({
    data: snapdevioUsersData.map((user) => ({
      ...user,
      password: hashedPassword,
      isActive: true,
      companyId: snapdevio.id,
    })),
  });

  // Fetch created users for references
  const snapdevioUsersList = await prisma.user.findMany({
    where: { companyId: snapdevio.id },
  });
  const snapdevioUsers = Object.fromEntries(
    snapdevioUsersList.map((u) => [u.email, u])
  );

  // Convenience references
  const snapdevioOwner = snapdevioUsers["owner@snapdevio.com"];
  const snapdevioAdmin = snapdevioUsers["admin@snapdevio.com"];
  const snapdevioUser1 = snapdevioUsers["jayendra.ramani@snapdevio.com"];
  const snapdevioUser2 = snapdevioUsers["chintandhokai97@gmail.com"];
  const snapdevioUser3 = snapdevioUsers["devang.patel@snapdevio.com"];

  // Update Snapdevio owner ID
  await prisma.company.update({
    where: { id: snapdevio.id },
    data: { ownerId: snapdevioOwner.id },
  });

  // Snapdevio assets data
  const snapdevioAssetsData = [
    { name: "MacBook Pro 16-inch", description: "Apple MacBook Pro with M3 Max chip, 64GB RAM, 1TB SSD", serialNumber: "SD-LP-001", model: "MacBook Pro 16 (2024)", manufacturer: "Apple", purchaseDate: new Date("2024-01-15"), purchasePrice: 3499.00, currentValue: 3200.00, location: "Snapdevio Office, Floor 4", status: AssetStatus.ASSIGNED, category: "Laptops", tags: ["apple", "development", "high-performance"], createdById: snapdevioOwner.id },
    { name: "Dell XPS 15", description: "Dell XPS 15 with Intel i9, 32GB RAM, 512GB SSD", serialNumber: "SD-LP-002", model: "XPS 15 9530", manufacturer: "Dell", purchaseDate: new Date("2024-02-20"), purchasePrice: 2199.00, currentValue: 1900.00, location: "Snapdevio Office, Floor 4", status: AssetStatus.ASSIGNED, category: "Laptops", tags: ["dell", "windows", "development"], createdById: snapdevioOwner.id },
    { name: "ThinkPad X1 Carbon", description: "Lenovo ThinkPad X1 Carbon Gen 11, Intel i7, 16GB RAM", serialNumber: "SD-LP-003", model: "X1 Carbon Gen 11", manufacturer: "Lenovo", purchaseDate: new Date("2024-03-10"), purchasePrice: 1899.00, currentValue: 1700.00, location: "Snapdevio Office, Floor 4", status: AssetStatus.AVAILABLE, category: "Laptops", tags: ["lenovo", "business", "ultrabook"], createdById: snapdevioAdmin.id },
    { name: "LG UltraWide 34-inch", description: "LG 34WN80C-B 34-inch Curved UltraWide Monitor", serialNumber: "SD-MN-001", model: "34WN80C-B", manufacturer: "LG", purchaseDate: new Date("2024-01-20"), purchasePrice: 699.00, currentValue: 600.00, location: "Snapdevio Office, Floor 4", status: AssetStatus.ASSIGNED, category: "Monitors", tags: ["lg", "ultrawide", "curved"], createdById: snapdevioOwner.id },
    { name: "Dell UltraSharp 27-inch 4K", description: "Dell UltraSharp U2723QE 27-inch 4K USB-C Hub Monitor", serialNumber: "SD-MN-002", model: "U2723QE", manufacturer: "Dell", purchaseDate: new Date("2024-02-25"), purchasePrice: 799.00, currentValue: 720.00, location: "Snapdevio Office, Floor 4", status: AssetStatus.AVAILABLE, category: "Monitors", tags: ["dell", "4k", "usb-c"], createdById: snapdevioAdmin.id },
    { name: "Logitech MX Keys", description: "Logitech MX Keys Advanced Wireless Illuminated Keyboard", serialNumber: "SD-KB-001", model: "MX Keys", manufacturer: "Logitech", purchaseDate: new Date("2024-01-25"), purchasePrice: 119.00, currentValue: 100.00, location: "Snapdevio Office, Floor 4", status: AssetStatus.ASSIGNED, category: "Peripherals", tags: ["logitech", "wireless", "keyboard"], createdById: snapdevioOwner.id },
    { name: "Logitech MX Master 3S", description: "Logitech MX Master 3S Wireless Performance Mouse", serialNumber: "SD-MS-001", model: "MX Master 3S", manufacturer: "Logitech", purchaseDate: new Date("2024-01-25"), purchasePrice: 99.00, currentValue: 85.00, location: "Snapdevio Office, Floor 4", status: AssetStatus.ASSIGNED, category: "Peripherals", tags: ["logitech", "wireless", "mouse"], createdById: snapdevioOwner.id },
    { name: "iPhone 15 Pro", description: "Apple iPhone 15 Pro, 256GB, Blue Titanium", serialNumber: "SD-PH-001", model: "iPhone 15 Pro", manufacturer: "Apple", purchaseDate: new Date("2024-04-01"), purchasePrice: 999.00, currentValue: 900.00, location: "Snapdevio Office, Floor 4", status: AssetStatus.ASSIGNED, category: "Mobile Devices", tags: ["apple", "smartphone", "5g"], createdById: snapdevioOwner.id },
    { name: "Epson PowerLite", description: "Epson PowerLite 1795F Wireless Full HD Projector", serialNumber: "SD-PJ-001", model: "PowerLite 1795F", manufacturer: "Epson", purchaseDate: new Date("2023-09-10"), purchasePrice: 899.00, currentValue: 700.00, location: "Conference Room", status: AssetStatus.UNDER_MAINTENANCE, category: "AV Equipment", tags: ["epson", "projector", "wireless"], createdById: snapdevioAdmin.id },
  ];

  // Create all Snapdevio assets
  await prisma.asset.createMany({
    data: snapdevioAssetsData.map((asset) => ({
      ...asset,
      companyId: snapdevio.id,
    })),
  });

  // Fetch created assets for references
  const snapdevioAssetsList = await prisma.asset.findMany({
    where: { companyId: snapdevio.id },
  });
  const snapdevioAssets = Object.fromEntries(
    snapdevioAssetsList.map((a) => [a.serialNumber, a])
  );

  // Snapdevio assignments data
  const snapdevioAssignmentsData: Array<{
    assetSerial: string;
    userEmail: string;
    assignedDate: Date;
    dueDate?: Date;
    returnDate?: Date;
    notes: string;
    status: AssignmentStatus;
  }> = [
    { assetSerial: "SD-LP-001", userEmail: "jayendra.ramani@snapdevio.com", assignedDate: new Date("2024-01-20"), dueDate: new Date("2025-01-20"), notes: "Assigned for software development work", status: AssignmentStatus.ACTIVE },
    { assetSerial: "SD-LP-002", userEmail: "chintandhokai97@gmail.com", assignedDate: new Date("2024-02-25"), dueDate: new Date("2025-02-25"), notes: "Assigned for frontend development", status: AssignmentStatus.ACTIVE },
    { assetSerial: "SD-MN-001", userEmail: "jayendra.ramani@snapdevio.com", assignedDate: new Date("2024-01-20"), notes: "Companion monitor for MacBook Pro", status: AssignmentStatus.ACTIVE },
    { assetSerial: "SD-KB-001", userEmail: "jayendra.ramani@snapdevio.com", assignedDate: new Date("2024-01-25"), notes: "Ergonomic keyboard for daily use", status: AssignmentStatus.ACTIVE },
    { assetSerial: "SD-MS-001", userEmail: "jayendra.ramani@snapdevio.com", assignedDate: new Date("2024-01-25"), notes: "Wireless mouse for productivity", status: AssignmentStatus.ACTIVE },
    { assetSerial: "SD-PH-001", userEmail: "devang.patel@snapdevio.com", assignedDate: new Date("2024-04-05"), dueDate: new Date("2025-04-05"), notes: "Company phone for client communication", status: AssignmentStatus.ACTIVE },
  ];

  // Create all Snapdevio assignments
  await prisma.assignment.createMany({
    data: snapdevioAssignmentsData.map(({ assetSerial, userEmail, ...rest }) => ({
      ...rest,
      assetId: snapdevioAssets[assetSerial].id,
      userId: snapdevioUsers[userEmail].id,
    })),
  });

  console.log("🏢 Created Snapdevio with users and assets");

  // ============================================
  // COMPANY 2: TECHCORP SOLUTIONS
  // ============================================
  const techCorp = await prisma.company.create({
    data: {
      name: "TechCorp Solutions",
      address: "123 Innovation Drive, Silicon Valley, CA 94025",
      phone: "+1 (555) 123-4567",
      email: "contact@techcorp.com",
      website: "https://techcorp.com",
      description: "Leading technology solutions provider specializing in enterprise software and hardware.",
      isActive: true,
      ownerId: "000000000000000000000000", // Placeholder, will be updated
    },
  });

  // TechCorp users data
  const techCorpUsersData = [
    { email: "owner@techcorp.com", firstName: "John", lastName: "Mitchell", role: Role.OWNER },
    { email: "admin@techcorp.com", firstName: "Sarah", lastName: "Johnson", role: Role.ADMIN },
    { email: "mike.chen@techcorp.com", firstName: "Mike", lastName: "Chen", role: Role.USER },
    { email: "emma.wilson@techcorp.com", firstName: "Emma", lastName: "Wilson", role: Role.USER },
    { email: "david.lee@techcorp.com", firstName: "David", lastName: "Lee", role: Role.USER },
  ];

  // Create all TechCorp users
  await prisma.user.createMany({
    data: techCorpUsersData.map((user) => ({
      ...user,
      password: hashedPassword,
      isActive: true,
      companyId: techCorp.id,
    })),
  });

  // Fetch created users for references
  const techCorpUsersList = await prisma.user.findMany({
    where: { companyId: techCorp.id },
  });
  const techCorpUsers = Object.fromEntries(
    techCorpUsersList.map((u) => [u.email, u])
  );

  // Convenience references
  const techOwner = techCorpUsers["owner@techcorp.com"];
  const techAdmin = techCorpUsers["admin@techcorp.com"];
  const techUser1 = techCorpUsers["mike.chen@techcorp.com"];
  const techUser2 = techCorpUsers["emma.wilson@techcorp.com"];
  const techUser3 = techCorpUsers["david.lee@techcorp.com"];

  // Update TechCorp owner ID
  await prisma.company.update({
    where: { id: techCorp.id },
    data: { ownerId: techOwner.id },
  });

  // TechCorp assets data
  const techCorpAssetsData = [
    { name: "MacBook Pro 14-inch", description: "Apple MacBook Pro with M3 Pro chip, 36GB RAM, 512GB SSD", serialNumber: "TC-LP-001", model: "MacBook Pro 14 (2024)", manufacturer: "Apple", purchaseDate: new Date("2024-01-15"), purchasePrice: 2499.00, currentValue: 2300.00, location: "Building A, Floor 2", status: AssetStatus.ASSIGNED, category: "Laptops", tags: ["apple", "development", "high-performance"], createdById: techOwner.id },
    { name: "Dell XPS 17", description: "Dell XPS 17 with Intel i9, 64GB RAM, 1TB SSD", serialNumber: "TC-LP-002", model: "XPS 17 9730", manufacturer: "Dell", purchaseDate: new Date("2024-02-20"), purchasePrice: 2899.00, currentValue: 2600.00, location: "Building A, Floor 2", status: AssetStatus.ASSIGNED, category: "Laptops", tags: ["dell", "windows", "development"], createdById: techOwner.id },
    { name: "HP EliteBook 860", description: "HP EliteBook 860 G10, Intel i7, 32GB RAM", serialNumber: "TC-LP-003", model: "EliteBook 860 G10", manufacturer: "HP", purchaseDate: new Date("2024-03-10"), purchasePrice: 1799.00, currentValue: 1600.00, location: "Building B, Floor 1", status: AssetStatus.AVAILABLE, category: "Laptops", tags: ["hp", "business", "enterprise"], createdById: techAdmin.id },
    { name: "Samsung Odyssey G9", description: "Samsung Odyssey G9 49-inch Curved Gaming Monitor", serialNumber: "TC-MN-001", model: "Odyssey G9", manufacturer: "Samsung", purchaseDate: new Date("2024-01-20"), purchasePrice: 1299.00, currentValue: 1100.00, location: "Building A, Floor 2", status: AssetStatus.ASSIGNED, category: "Monitors", tags: ["samsung", "ultrawide", "curved"], createdById: techOwner.id },
    { name: "ASUS ProArt 32-inch 4K", description: "ASUS ProArt PA32UCX-PK 32-inch 4K HDR Monitor", serialNumber: "TC-MN-002", model: "PA32UCX-PK", manufacturer: "ASUS", purchaseDate: new Date("2024-02-25"), purchasePrice: 2999.00, currentValue: 2700.00, location: "Building A, Floor 3", status: AssetStatus.AVAILABLE, category: "Monitors", tags: ["asus", "4k", "professional"], createdById: techAdmin.id },
    { name: "Dell PowerEdge R750", description: "Dell PowerEdge R750 Server, Dual Xeon, 256GB RAM, 4TB NVMe", serialNumber: "TC-SV-001", model: "PowerEdge R750", manufacturer: "Dell", purchaseDate: new Date("2023-06-15"), purchasePrice: 15999.00, currentValue: 13500.00, location: "Data Center, Rack A1", status: AssetStatus.AVAILABLE, category: "Servers", tags: ["dell", "server", "enterprise"], createdById: techOwner.id },
    { name: "Keychron Q1 Pro", description: "Keychron Q1 Pro Wireless Mechanical Keyboard", serialNumber: "TC-KB-001", model: "Q1 Pro", manufacturer: "Keychron", purchaseDate: new Date("2024-01-25"), purchasePrice: 199.00, currentValue: 180.00, location: "Building A, Floor 2", status: AssetStatus.ASSIGNED, category: "Peripherals", tags: ["keychron", "mechanical", "wireless"], createdById: techOwner.id },
    { name: "Razer DeathAdder V3 Pro", description: "Razer DeathAdder V3 Pro Wireless Gaming Mouse", serialNumber: "TC-MS-001", model: "DeathAdder V3 Pro", manufacturer: "Razer", purchaseDate: new Date("2024-01-25"), purchasePrice: 149.00, currentValue: 130.00, location: "Building A, Floor 2", status: AssetStatus.ASSIGNED, category: "Peripherals", tags: ["razer", "wireless", "gaming"], createdById: techOwner.id },
    { name: "iPhone 15 Pro Max", description: "Apple iPhone 15 Pro Max, 512GB, Natural Titanium", serialNumber: "TC-PH-001", model: "iPhone 15 Pro Max", manufacturer: "Apple", purchaseDate: new Date("2024-04-01"), purchasePrice: 1399.00, currentValue: 1250.00, location: "Building A, Floor 2", status: AssetStatus.ASSIGNED, category: "Mobile Devices", tags: ["apple", "smartphone", "5g"], createdById: techOwner.id },
    { name: "iPad Pro 12.9-inch", description: "Apple iPad Pro 12.9-inch with M2 chip, 256GB", serialNumber: "TC-TB-001", model: "iPad Pro 12.9 (2024)", manufacturer: "Apple", purchaseDate: new Date("2024-03-15"), purchasePrice: 1199.00, currentValue: 1100.00, location: "Building A, Floor 2", status: AssetStatus.RETIRED, category: "Tablets", tags: ["apple", "tablet", "productivity"], createdById: techAdmin.id },
  ];

  // Create all TechCorp assets
  await prisma.asset.createMany({
    data: techCorpAssetsData.map((asset) => ({
      ...asset,
      companyId: techCorp.id,
    })),
  });

  // Fetch created assets for references
  const techCorpAssetsList = await prisma.asset.findMany({
    where: { companyId: techCorp.id },
  });
  const techCorpAssets = Object.fromEntries(
    techCorpAssetsList.map((a) => [a.serialNumber, a])
  );

  // TechCorp assignments data
  const techCorpAssignmentsData: Array<{
    assetSerial: string;
    userEmail: string;
    assignedDate: Date;
    dueDate?: Date;
    returnDate?: Date;
    notes: string;
    status: AssignmentStatus;
  }> = [
    { assetSerial: "TC-LP-001", userEmail: "mike.chen@techcorp.com", assignedDate: new Date("2024-01-20"), dueDate: new Date("2025-01-20"), notes: "Assigned for software development work", status: AssignmentStatus.ACTIVE },
    { assetSerial: "TC-LP-002", userEmail: "emma.wilson@techcorp.com", assignedDate: new Date("2024-02-25"), dueDate: new Date("2025-02-25"), notes: "Assigned for data science projects", status: AssignmentStatus.ACTIVE },
    { assetSerial: "TC-MN-001", userEmail: "mike.chen@techcorp.com", assignedDate: new Date("2024-01-20"), notes: "Ultrawide monitor for development", status: AssignmentStatus.ACTIVE },
    { assetSerial: "TC-KB-001", userEmail: "mike.chen@techcorp.com", assignedDate: new Date("2024-01-25"), notes: "Mechanical keyboard for coding", status: AssignmentStatus.ACTIVE },
    { assetSerial: "TC-MS-001", userEmail: "mike.chen@techcorp.com", assignedDate: new Date("2024-01-25"), notes: "Gaming mouse for precision work", status: AssignmentStatus.ACTIVE },
    { assetSerial: "TC-PH-001", userEmail: "david.lee@techcorp.com", assignedDate: new Date("2024-04-05"), dueDate: new Date("2025-04-05"), notes: "Company phone for field work", status: AssignmentStatus.ACTIVE },
    { assetSerial: "TC-LP-003", userEmail: "emma.wilson@techcorp.com", assignedDate: new Date("2024-03-15"), returnDate: new Date("2024-06-15"), notes: "Temporary assignment during equipment upgrade", status: AssignmentStatus.RETURNED },
    { assetSerial: "TC-TB-001", userEmail: "admin@techcorp.com", assignedDate: new Date("2024-03-20"), returnDate: new Date("2024-08-01"), notes: "Transferred to storage after retirement", status: AssignmentStatus.TRANSFERRED },
  ];

  // Create all TechCorp assignments
  await prisma.assignment.createMany({
    data: techCorpAssignmentsData.map(({ assetSerial, userEmail, ...rest }) => ({
      ...rest,
      assetId: techCorpAssets[assetSerial].id,
      userId: techCorpUsers[userEmail].id,
    })),
  });

  console.log("🏢 Created TechCorp with users and assets");

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("- Companies: 2 (Snapdevio, TechCorp Solutions)");
  console.log("- Users: 10 (5 per company - 1 Owner, 1 Admin, 3 Users)");
  console.log("- Assets: 19");
  console.log("- Assignments: 14");
  console.log("\n🔑 Login credentials (all users):");
  console.log("   Password: password123");
  console.log("\n👤 Sample users:");
  console.log("Snapdevio:");
  console.log("- Owner: owner@snapdevio.com");
  console.log("- Admin: admin@snapdevio.com");
  console.log("- User: jayendra.ramani@snapdevio.com");
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

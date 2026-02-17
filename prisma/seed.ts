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

  // Helper function to create asset with assignment
  async function createAssetWithAssignment({
    userEmail,
    name,
    serial,
    manufacturer,
    category,
    ownershipTag,
    description = "",
    model = "",
  }: {
    userEmail: string;
    name: string;
    serial: string;
    manufacturer: string;
    category: string;
    ownershipTag: "Asset Company" | "Asset Private";
    description?: string;
    model?: string;
  }) {
    const user = snapdevioUsers[userEmail];
    if (!user) {
      console.warn(`User ${userEmail} not found, skipping asset ${name}`);
      return;
    }

    const ownershipType = ownershipTag === "Asset Private" ? "PRIVATE" : "COMPANY";
    const ownerId = ownershipTag === "Asset Private" ? user.id : null;

    const asset = await prisma.asset.create({
      data: {
        name,
        description,
        serialNumber: serial,
        model,
        manufacturer,
        status: AssetStatus.ASSIGNED,
        category,
        ownershipType,
        tags: [ownershipTag],
        companyId: snapdevio.id,
        createdById: snapdevioOwner.id,
        ownerId,
      },
    });

    await prisma.assignment.create({
      data: {
        assetId: asset.id,
        userId: user.id,
        assignedDate: new Date(),
        dueDate: new Date("2026-02-13"),
        status: AssignmentStatus.ACTIVE,
        notes: `Initial assignment - ${ownershipTag}`,
      },
    });
  }

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
    { email: "rohit.bhadani@snapdevio.com", firstName: "Rohit", lastName: "Bhadani", role: Role.ADMIN },
    { email: "alpesh.gevariya@snapdevio.com", firstName: "Alpesh", lastName: "Gevariya", role: Role.ADMIN },
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
  ]

;

  // Create Snapdevio users with individual passwords (firstname@snapdevio406)
  for (const userData of snapdevioUsersData) {
    const password = userData.role === Role.OWNER || userData.role === Role.ADMIN
      ? await bcrypt.hash("password123", 10) // Keep simple password for owner/admin
      : await bcrypt.hash(`${userData.firstName.toLowerCase()}@snapdevio406`, 10);
    
    await prisma.user.create({
      data: {
        ...userData,
        password,
        isActive: true,
        companyId: snapdevio.id,
      },
    });
  }

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

  // ============================================
  // SNAPDEVIO ASSETS & ASSIGNMENTS
  // ============================================
  console.log("Creating Snapdevio assets and assignments...");

  // Chintan Dhokai
  await createAssetWithAssignment({ userEmail: "chintandhokai97@gmail.com", name: "Dell Laptop", serial: "SD-CH-001", model:"Dell Latitude 5420", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "chintandhokai97@gmail.com", name: "Charger", serial: "SD-CH-002", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "chintandhokai97@gmail.com", name: "Mouse", serial: "SD-CH-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "chintandhokai97@gmail.com", name: "Mouse Pad", serial: "SD-CH-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

  // Devang Patel
  await createAssetWithAssignment({ userEmail: "devang.patel@snapdevio.com", name: "MacBook", serial: "SD-DP-001", manufacturer: "Apple", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "devang.patel@snapdevio.com", name: "Mouse", serial: "SD-DP-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "devang.patel@snapdevio.com", name: "Charger", serial: "SD-DP-003", manufacturer: "Apple", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "devang.patel@snapdevio.com", name: "Mouse Pad", serial: "SD-DP-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "devang.patel@snapdevio.com", name: "Laptop Stand", serial: "SD-DP-005", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });

  // Bhavesh Patel
  await createAssetWithAssignment({ userEmail: "bhavesh.patel@snapdevio.com", name: "Desktop", serial: "SD-BP-001", manufacturer: "HP", category: "Desktop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "bhavesh.patel@snapdevio.com", name: "Keyboard", serial: "SD-BP-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "bhavesh.patel@snapdevio.com", name: "Mouse", serial: "SD-BP-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "bhavesh.patel@snapdevio.com", name: "Mouse Pad", serial: "SD-BP-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "bhavesh.patel@snapdevio.com", name: "CPU", serial: "SD-BP-005", manufacturer: "Intel", category: "Component", ownershipTag: "Asset Private" });

  // Abhay Gaudani
  await createAssetWithAssignment({ userEmail: "abhay.gaudani@snapdevio.com", name: "Asus Laptop", serial: "SD-AG-001", manufacturer: "Asus", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "abhay.gaudani@snapdevio.com", name: "Mouse", serial: "SD-AG-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "abhay.gaudani@snapdevio.com", name: "Charger", serial: "SD-AG-003", manufacturer: "Asus", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "abhay.gaudani@snapdevio.com", name: "Mouse Pad", serial: "SD-AG-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "abhay.gaudani@snapdevio.com", name: "Keyboard", serial: "SD-AG-005", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });

  // Devarshi Savaliya
  await createAssetWithAssignment({ userEmail: "devarshi.savaliya@snapdevio.com", name: "Desktop", serial: "SD-DS-001", manufacturer: "HP", category: "Desktop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "devarshi.savaliya@snapdevio.com", name: "Keyboard", serial: "SD-DS-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "devarshi.savaliya@snapdevio.com", name: "Mouse", serial: "SD-DS-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "devarshi.savaliya@snapdevio.com", name: "Mouse Pad", serial: "SD-DS-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "devarshi.savaliya@snapdevio.com", name: "CPU", serial: "SD-DS-005", manufacturer: "Intel", category: "Component", ownershipTag: "Asset Company" });

  // Paras Devaliya
  await createAssetWithAssignment({ userEmail: "paras.devaliya@snapdevio.com", name: "Dell Laptop", serial: "SD-PD-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "paras.devaliya@snapdevio.com", name: "Mouse", serial: "SD-PD-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "paras.devaliya@snapdevio.com", name: "Charger", serial: "SD-PD-003", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "paras.devaliya@snapdevio.com", name: "Mouse Pad", serial: "SD-PD-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

  // Dhvanil Soladhra
  await createAssetWithAssignment({ userEmail: "dhvanil.soladhra@snapdevio.com", name: "Lenovo Laptop", serial: "SD-DHS-001", manufacturer: "Lenovo", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dhvanil.soladhra@snapdevio.com", name: "Mouse", serial: "SD-DHS-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dhvanil.soladhra@snapdevio.com", name: "Charger", serial: "SD-DHS-003", manufacturer: "Lenovo", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dhvanil.soladhra@snapdevio.com", name: "Mouse Pad", serial: "SD-DHS-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dhvanil.soladhra@snapdevio.com", name: "Laptop Stand", serial: "SD-DHS-005", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });

  // Meet Sheladiya
  await createAssetWithAssignment({ userEmail: "training+meet@snapdevio.com", name: "Dell Laptop", serial: "SD-MS-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "training+meet@snapdevio.com", name: "Laptop Stand", serial: "SD-MS-002", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "training+meet@snapdevio.com", name: "Mouse", serial: "SD-MS-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "training+meet@snapdevio.com", name: "Charger", serial: "SD-MS-004", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "training+meet@snapdevio.com", name: "Mouse Pad", serial: "SD-MS-005", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "training+meet@snapdevio.com", name: "Keyboard", serial: "SD-MS-006", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });

  // Krina Kumbhani
  await createAssetWithAssignment({ userEmail: "krina.kumbhani@snapdevio.com", name: "Dell Laptop", serial: "SD-KK-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "krina.kumbhani@snapdevio.com", name: "Mouse", serial: "SD-KK-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "krina.kumbhani@snapdevio.com", name: "Charger", serial: "SD-KK-003", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });

  // Raj Dhokai
  await createAssetWithAssignment({ userEmail: "raj.dhokai@snapdevio.com", name: "HP Laptop", serial: "SD-RD-001", manufacturer: "HP", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "raj.dhokai@snapdevio.com", name: "Mouse", serial: "SD-RD-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "raj.dhokai@snapdevio.com", name: "Mouse Pad", serial: "SD-RD-003", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "raj.dhokai@snapdevio.com", name: "Charger", serial: "SD-RD-004", manufacturer: "HP", category: "Accessory", ownershipTag: "Asset Private" });

  // Diya Ghelani
  await createAssetWithAssignment({ userEmail: "diya.ghelani@snapdevio.com", name: "Desktop", serial: "SD-DG-001", manufacturer: "HP", category: "Desktop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "diya.ghelani@snapdevio.com", name: "Keyboard", serial: "SD-DG-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "diya.ghelani@snapdevio.com", name: "Mouse Pad", serial: "SD-DG-003", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "diya.ghelani@snapdevio.com", name: "Mouse", serial: "SD-DG-004", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "diya.ghelani@snapdevio.com", name: "CPU", serial: "SD-DG-005", manufacturer: "Intel", category: "Component", ownershipTag: "Asset Company" });

  // Divyang Bhadani
  await createAssetWithAssignment({ userEmail: "divyang.bhadani@snapdevio.com", name: "Asus Laptop", serial: "SD-DB-001", manufacturer: "Asus", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "divyang.bhadani@snapdevio.com", name: "Mouse", serial: "SD-DB-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "divyang.bhadani@snapdevio.com", name: "Mouse Pad", serial: "SD-DB-003", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "divyang.bhadani@snapdevio.com", name: "Charger", serial: "SD-DB-004", manufacturer: "Asus", category: "Accessory", ownershipTag: "Asset Private" });

  // Dhruti Hirapara
  await createAssetWithAssignment({ userEmail: "dhruti.hirapara@snapdevio.com", name: "Desktop", serial: "SD-DHI-001", manufacturer: "HP", category: "Desktop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "dhruti.hirapara@snapdevio.com", name: "Keyboard", serial: "SD-DHI-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "dhruti.hirapara@snapdevio.com", name: "Mouse", serial: "SD-DHI-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "dhruti.hirapara@snapdevio.com", name: "Mouse Pad", serial: "SD-DHI-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "dhruti.hirapara@snapdevio.com", name: "CPU", serial: "SD-DHI-005", manufacturer: "Intel", category: "Component", ownershipTag: "Asset Company" });

  // Dilip Jasoliya
  await createAssetWithAssignment({ userEmail: "dilip.jasoliya@snapdevio.com", name: "Desktop", serial: "SD-DJ-001", manufacturer: "HP", category: "Desktop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dilip.jasoliya@snapdevio.com", name: "Keyboard", serial: "SD-DJ-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dilip.jasoliya@snapdevio.com", name: "Mouse", serial: "SD-DJ-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dilip.jasoliya@snapdevio.com", name: "Mouse Pad", serial: "SD-DJ-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dilip.jasoliya@snapdevio.com", name: "CPU", serial: "SD-DJ-005", manufacturer: "Intel", category: "Component", ownershipTag: "Asset Private" });

  // Dhruvi Tagadiya
  await createAssetWithAssignment({ userEmail: "dhruvi.tagadiya@snapdevio.com", name: "Dell Laptop", serial: "SD-DT-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dhruvi.tagadiya@snapdevio.com", name: "Charger", serial: "SD-DT-002", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dhruvi.tagadiya@snapdevio.com", name: "Mouse", serial: "SD-DT-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "dhruvi.tagadiya@snapdevio.com", name: "Mouse Pad", serial: "SD-DT-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Private" });

  // Nishank Radadiya
  await createAssetWithAssignment({ userEmail: "nishank.radadiya@snapdevio.com", name: "Acer Predator Laptop", serial: "SD-NR-001", manufacturer: "Acer", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "nishank.radadiya@snapdevio.com", name: "Charger", serial: "SD-NR-002", manufacturer: "Acer", category: "Accessory", ownershipTag: "Asset Company" });

  // Vanshita Nakrani
  await createAssetWithAssignment({ userEmail: "training+vanshita@snapdevio.com", name: "Dell Laptop", serial: "SD-VN-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "training+vanshita@snapdevio.com", name: "Charger", serial: "SD-VN-002", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });

  // Meghna Tandel
  await createAssetWithAssignment({ userEmail: "meghna.tandel@snapdevio.com", name: "HP Laptop", serial: "SD-MT-001", manufacturer: "HP", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "meghna.tandel@snapdevio.com", name: "Charger", serial: "SD-MT-002", manufacturer: "HP", category: "Accessory", ownershipTag: "Asset Private" });

  // Fensi Kotadiya
  await createAssetWithAssignment({ userEmail: "fensi.kotadiya@snapdevio.com", name: "Dell Laptop", serial: "SD-FK-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "fensi.kotadiya@snapdevio.com", name: "Mouse", serial: "SD-FK-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "fensi.kotadiya@snapdevio.com", name: "Charger", serial: "SD-FK-003", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "fensi.kotadiya@snapdevio.com", name: "Mouse Pad", serial: "SD-FK-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

  // Krutika Lakhani
  await createAssetWithAssignment({ userEmail: "krutika.lakhani@snapdevio.com", name: "Dell Laptop", serial: "SD-KL-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "krutika.lakhani@snapdevio.com", name: "Mouse", serial: "SD-KL-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "krutika.lakhani@snapdevio.com", name: "Charger", serial: "SD-KL-003", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "krutika.lakhani@snapdevio.com", name: "Mouse Pad", serial: "SD-KL-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

  // Khushbu Pambhar
  await createAssetWithAssignment({ userEmail: "khushbu.pambhar@snapdevio.com", name: "Dell Laptop", serial: "SD-KP-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "khushbu.pambhar@snapdevio.com", name: "Mouse", serial: "SD-KP-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "khushbu.pambhar@snapdevio.com", name: "Charger", serial: "SD-KP-003", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "khushbu.pambhar@snapdevio.com", name: "Mouse Pad", serial: "SD-KP-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

  // Kaushik Gaudani
  await createAssetWithAssignment({ userEmail: "kaushik.gaudani@snapdevio.com", name: "Dell Laptop", serial: "SD-KG-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "kaushik.gaudani@snapdevio.com", name: "Laptop Stand", serial: "SD-KG-002", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "kaushik.gaudani@snapdevio.com", name: "Mouse", serial: "SD-KG-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "kaushik.gaudani@snapdevio.com", name: "Charger", serial: "SD-KG-004", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "kaushik.gaudani@snapdevio.com", name: "Mouse Pad", serial: "SD-KG-005", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

  // Priyanka Dudhat
  await createAssetWithAssignment({ userEmail: "priyanka.dudhat@snapdevio.com", name: "Dell Laptop", serial: "SD-PRD-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "priyanka.dudhat@snapdevio.com", name: "Mouse", serial: "SD-PRD-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "priyanka.dudhat@snapdevio.com", name: "Charger", serial: "SD-PRD-003", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "priyanka.dudhat@snapdevio.com", name: "Mouse Pad", serial: "SD-PRD-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

  // Jenish Bhadani
  await createAssetWithAssignment({ userEmail: "jenish.bhadani@snapdevio.com", name: "Dell Laptop", serial: "SD-JB-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "jenish.bhadani@snapdevio.com", name: "Charger 65W", serial: "SD-JB-002", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });

  // Chirag Chovatiya
  await createAssetWithAssignment({ userEmail: "chirag.chovatiya@snapdevio.com", name: "Dell 5520 16/256", serial: "4F49BA60-EE6B-4B1F-A513-C617E942772E", model:"DELL-5520", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "chirag.chovatiya@snapdevio.com", name: "Mouse", serial: "2204HS002298",model:"M-U-0026", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "chirag.chovatiya@snapdevio.com", name: "Charger", serial: "----", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "chirag.chovatiya@snapdevio.com", name: "Mouse Pad", serial: "-----", manufacturer: "Info computer", category: "Accessory", ownershipTag: "Asset Company" });

  // Gaurav Malviya
  await createAssetWithAssignment({ userEmail: "gaurav.malviya@snapdevio.com", name: "MacBook", serial: "SD-GM-001", manufacturer: "Apple", category: "Laptop", ownershipTag: "Asset Private" });
  await createAssetWithAssignment({ userEmail: "gaurav.malviya@snapdevio.com", name: "Charger", serial: "SD-GM-002", manufacturer: "Apple", category: "Accessory", ownershipTag: "Asset Private" });

  // Shivang Dave
  await createAssetWithAssignment({ userEmail: "shivang.dave@snapdevio.com", name: "Dell Laptop", serial: "SD-SD-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "shivang.dave@snapdevio.com", name: "Mouse", serial: "SD-SD-002", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "shivang.dave@snapdevio.com", name: "Charger", serial: "SD-SD-003", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "shivang.dave@snapdevio.com", name: "Mouse Pad", serial: "SD-SD-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

  // Rakesh Gosalia
  await createAssetWithAssignment({ userEmail: "rakesh.gosalia@snapdevio.com", name: "Dell Laptop", serial: "SD-RG-001", manufacturer: "Dell", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "rakesh.gosalia@snapdevio.com", name: "Charger", serial: "SD-RG-002", manufacturer: "Dell", category: "Accessory", ownershipTag: "Asset Company" });

  // Jayendra Ramani
  await createAssetWithAssignment({ userEmail: "jayendra.ramani@snapdevio.com", name: "Asus ROG Strix Laptop", description:"", serial: "SD-JR-001", model:"", manufacturer: "Asus", category: "Laptop", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "jayendra.ramani@snapdevio.com", name: "Charger", serial: "SD-JR-002", manufacturer: "Asus", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "jayendra.ramani@snapdevio.com", name: "Mouse", serial: "SD-JR-003", manufacturer: "Logitech", category: "Accessory", ownershipTag: "Asset Company" });
  await createAssetWithAssignment({ userEmail: "jayendra.ramani@snapdevio.com", name: "Mouse Pad", serial: "SD-JR-004", manufacturer: "Generic", category: "Accessory", ownershipTag: "Asset Company" });

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

  // Create TechCorp users with individual passwords
  const techCorpPassword = await bcrypt.hash("password123", 10);
  for (const userData of techCorpUsersData) {
    await prisma.user.create({
      data: {
        ...userData,
        password: techCorpPassword,
        isActive: true,
        companyId: techCorp.id,
      },
    });
  }

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

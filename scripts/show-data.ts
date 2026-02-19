import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== PER COMPANY LATEST ASSET ASSIGNMENTS ===");

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  for (const company of companies) {
    console.log(`\n🏢 Company: ${company.name}`);

    // Find assets belonging to this company
    const assetIds = (
      await prisma.asset.findMany({
        where: { companyId: company.id },
        select: { id: true },
      })
    ).map((a) => a.id);

    if (assetIds.length === 0) {
      console.log("   (No assets found for this company)");
      continue;
    }

    // Find latest assignments for these assets
    const assignments = await prisma.assignment.findMany({
      where: { assetId: { in: assetIds } },
      take: 5,
      orderBy: { assignedDate: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        asset: { select: { name: true, serialNumber: true } },
      },
    });

    if (assignments.length === 0) {
      console.log("   (No assignment history found)");
    } else {
      const formatted = assignments.map((a) => ({
        Asset: a.asset.name,
        Serial: a.asset.serialNumber || "N/A",
        User: `${a.user.firstName} ${a.user.lastName}`,
        Email: a.user.email,
        Status: a.status,
        Date: a.assignedDate.toLocaleDateString(),
      }));
      console.table(formatted);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

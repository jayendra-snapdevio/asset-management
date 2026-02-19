import { prisma } from "~/lib/db.server";
import { getCompanyFilter } from "./company.service.server";

export interface DashboardStats {
  totalAssets: number;
  assignedAssets: number;
  availableAssets: number;
  underMaintenance: number;
  retiredAssets: number;
  totalUsers: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface CategoryDistribution {
  category: string | null;
  count: number;
}

export interface RecentAsset {
  id: string;
  name: string;
  category: string | null;
  status: string;
  createdAt: Date;
}

export interface RecentActivity {
  id: string;
  status: string;
  assignedDate: Date;
  returnDate: Date | null;
  asset: { id: string; name: string; companyName?: string };
  user: { id: string; firstName: string; lastName: string };
}

export interface CompanyActivity {
  companyId: string;
  companyName: string;
  activities: RecentActivity[];
}

/**
 * Get dashboard data for admin/owner users
 */
export async function getAdminDashboard(user: {
  id: string;
  role: string;
  companyId: string | null;
}) {
  const companyFilter = await getCompanyFilter(user);

  // Build asset filter - handle the case when companyId might be null
  const assetWhere =
    user.role === "OWNER"
      ? companyFilter
      : user.companyId
        ? { companyId: user.companyId }
        : {};

  const [
    totalAssets,
    statusCounts,
    categoryCounts,
    recentAssets,
    recentActivity,
    userCount,
  ] = await Promise.all([
    // Total assets
    prisma.asset.count({ where: assetWhere }),

    // Status distribution
    prisma.asset.groupBy({
      by: ["status"],
      where: assetWhere,
      _count: true,
    }),

    // Category distribution (top 5)
    prisma.asset.groupBy({
      by: ["category"],
      where: assetWhere,
      _count: true,
      orderBy: { _count: { category: "desc" } },
      take: 5,
    }),

    // Recent assets
    prisma.asset.findMany({
      where: assetWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
        createdAt: true,
      },
    }),

    // Recent activity (assignments)
    prisma.assignment
      .findMany({
        where: {
          asset: assetWhere,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          status: true,
          assignedDate: true,
          returnDate: true,
          assetId: true,
          userId: true,
        },
      })
      .then(async (assignments) => {
        // Get valid user and asset IDs
        const userIds = [...new Set(assignments.map((a) => a.userId))];
        const assetIds = [...new Set(assignments.map((a) => a.assetId))];

        const [users, assets] = await Promise.all([
          prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true },
          }),
          prisma.asset.findMany({
            where: { id: { in: assetIds } },
            select: {
              id: true,
              name: true,
              company: {
                select: { name: true },
              },
            },
          }),
        ]);

        const userMap = new Map(users.map((u) => [u.id, u]));
        const assetMap = new Map(assets.map((a) => [a.id, a]));

        // Filter and map assignments with valid relations
        return assignments
          .filter((a) => userMap.has(a.userId) && assetMap.has(a.assetId))
          .map((a) => {
            const asset = assetMap.get(a.assetId)!;
            return {
              id: a.id,
              status: a.status,
              assignedDate: a.assignedDate,
              returnDate: a.returnDate,
              user: userMap.get(a.userId)!,
              asset: {
                id: asset.id,
                name: asset.name,
                companyName: asset.company?.name,
              },
            };
          });
      }),

    // User count - handle companyId null case
    prisma.user.count({
      where: user.companyId
        ? { companyId: user.companyId, isActive: true }
        : { isActive: true },
    }),
  ]);

  // Calculate stats - _count is a number when using _count: true
  const getStatusCount = (status: string) => {
    const found = statusCounts.find((s) => s.status === status);
    return found ? (found._count as number) : 0;
  };

  const stats: DashboardStats = {
    totalAssets,
    assignedAssets: getStatusCount("ASSIGNED"),
    availableAssets: getStatusCount("AVAILABLE"),
    underMaintenance: getStatusCount("UNDER_MAINTENANCE"),
    retiredAssets: getStatusCount("RETIRED"),
    totalUsers: userCount,
  };

  const statusDistribution: StatusDistribution[] = statusCounts.map((s) => ({
    status: s.status,
    count: s._count as number,
    percentage:
      totalAssets > 0
        ? Math.round(((s._count as number) / totalAssets) * 100)
        : 0,
  }));

  const categoryDistribution: CategoryDistribution[] = categoryCounts.map(
    (c) => ({
      category: c.category,
      count: c._count as number,
    }),
  );

  return {
    stats,
    statusDistribution,
    categoryDistribution,
    recentAssets: recentAssets as RecentAsset[],
    recentActivity: recentActivity as RecentActivity[],
  };
}

/**
 * Get dashboard data for regular users (their own assets)
 */
export async function getUserDashboard(userId: string) {
  // Get assignments first, then filter by valid assets
  const [
    allActiveAssignments,
    allHistory,
    totalAssigned,
    totalReturned,
    ownedAssets,
  ] = await Promise.all([
    prisma.assignment.findMany({
      where: { userId, status: "ACTIVE" },
      select: {
        id: true,
        assignedDate: true,
        assetId: true,
        status: true,
      },
      orderBy: { assignedDate: "desc" },
    }),
    prisma.assignment.findMany({
      where: { userId },
      select: {
        id: true,
        assignedDate: true,
        returnDate: true,
        assetId: true,
        status: true,
        notes: true,
      },
      orderBy: { assignedDate: "desc" },
      take: 15,
    }),
    prisma.assignment.count({ where: { userId } }),
    prisma.assignment.count({ where: { userId, status: "RETURNED" } }),
    prisma.asset.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        serialNumber: true,
        category: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Get all unique asset IDs
  const allAssetIds = [
    ...new Set([
      ...allActiveAssignments.map((a) => a.assetId),
      ...allHistory.map((a) => a.assetId),
    ]),
  ];

  // Fetch valid assets
  const assets = await prisma.asset.findMany({
    where: { id: { in: allAssetIds } },
    select: {
      id: true,
      name: true,
      serialNumber: true,
      category: true,
      status: true,
    },
  });
  const assetMap = new Map(assets.map((a) => [a.id, a]));

  // Filter and map assignments with valid assets
  const myAssets = allActiveAssignments
    .filter((a) => assetMap.has(a.assetId))
    .map((a) => ({
      id: a.id,
      assignedDate: a.assignedDate,
      status: a.status,
      asset: assetMap.get(a.assetId)!,
    }));

  const history = allHistory
    .filter((a) => assetMap.has(a.assetId))
    .slice(0, 10)
    .map((a) => ({
      id: a.id,
      assignedDate: a.assignedDate,
      returnDate: a.returnDate,
      status: a.status,
      notes: a.notes,
      asset: assetMap.get(a.assetId)!,
    }));

  return {
    myAssets,
    history,
    ownedAssets,
    stats: {
      currentAssets: myAssets.length,
      ownedAssets: ownedAssets.length,
      totalAssigned,
      totalReturned,
    },
  };
}

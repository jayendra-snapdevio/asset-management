import { prisma } from "../lib/db.server";
import { RequestStatus } from "@prisma/client";

export interface CreateRequestInput {
  userId: string;
  assetName: string;
  reason?: string;
}

export async function createAssetRequest(input: CreateRequestInput) {
  return prisma.assetRequest.create({
    data: {
      userId: input.userId,
      assetName: input.assetName,
      reason: input.reason,
      status: "PENDING",
    },
  });
}

export async function getAssetRequests(filters: {
  userId?: string;
  status?: RequestStatus;
}) {
  return prisma.assetRequest.findMany({
    where: {
      userId: filters.userId,
      status: filters.status,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
  adminNotes?: string,
) {
  const data: any = { status };
  if (adminNotes !== undefined) {
    data.adminNotes = adminNotes;
  }
  if (status === "FULFILLED") {
    data.fulfilledAt = new Date();
  }

  return prisma.assetRequest.update({
    where: { id },
    data,
  });
}

export async function getRequestById(id: string) {
  return prisma.assetRequest.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });
}

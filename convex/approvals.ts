import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new transfer or direct purchase approval request
export const createApprovalRequest = mutation({
  args: {
    clientId: v.id("clients"),
    type: v.union(v.literal("transfer"), v.literal("direct_purchase")),
    sourceLocationType: v.optional(v.string()), // "warehouse" | "store"
    sourceLocationId: v.optional(v.string()),
    sourceLocationName: v.optional(v.string()),
    destinationLocationType: v.optional(v.string()), // "store" | "warehouse"
    destinationLocationId: v.optional(v.string()),
    destinationLocationName: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.string(),
        productCode: v.optional(v.string()),
        quantity: v.number(),
        costPerUnit: v.optional(v.number()),
      })
    ),
    paymentMethod: v.optional(v.string()),
    bankProvider: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    totalCost: v.optional(v.number()),
    notes: v.optional(v.string()),
    requestedByUserId: v.string(),
    requestedByUserName: v.string(),
    requestedByUserEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const requestId = await ctx.db.insert("approvalRequests", {
      clientId: args.clientId,
      type: args.type,
      status: "pending",
      sourceLocationType: args.sourceLocationType,
      sourceLocationId: args.sourceLocationId,
      sourceLocationName: args.sourceLocationName,
      destinationLocationType: args.destinationLocationType,
      destinationLocationId: args.destinationLocationId,
      destinationLocationName: args.destinationLocationName,
      items: args.items,
      paymentMethod: args.paymentMethod,
      bankProvider: args.bankProvider,
      supplierName: args.supplierName,
      totalCost: args.totalCost,
      notes: args.notes,
      requestedByUserId: args.requestedByUserId,
      requestedByUserName: args.requestedByUserName,
      requestedByUserEmail: args.requestedByUserEmail,
      createdAt: now,
    });

    // Log to audit trail
    await ctx.db.insert("auditLogs", {
      clientId: args.clientId,
      actorId: args.requestedByUserId,
      actorName: args.requestedByUserName,
      role: "staff",
      action: args.type === "transfer" ? "TRANSFER_REQUEST_SUBMITTED" : "PURCHASE_REQUEST_SUBMITTED",
      description:
        args.type === "transfer"
          ? `Submitted transfer request for ${args.items.reduce((s, it) => s + it.quantity, 0)} units from ${args.sourceLocationName || "Source"} to ${args.destinationLocationName || "Destination"}`
          : `Submitted direct purchase request for ${args.items.reduce((s, it) => s + it.quantity, 0)} units for ${args.destinationLocationName || "Store"}`,
      target: requestId,
      timestamp: now,
    });

    return requestId;
  },
});

// Update Telegram message info on an approval request
export const setTelegramMessageInfo = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    messageId: v.number(),
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      telegramMessageId: args.messageId,
      telegramChatId: args.chatId,
    });
    return true;
  },
});

// Get pending approvals for an organization
export const getPendingApprovals = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("approvalRequests")
      .withIndex("by_clientId_status", (q) =>
        q.eq("clientId", args.clientId).eq("status", "pending")
      )
      .order("desc")
      .collect();
    return list;
  },
});

// Get all approvals (history) for an organization
export const getAllApprovals = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const list = await ctx.db
      .query("approvalRequests")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(100);
    return list;
  },
});

// Approve an approval request and atomically apply stock movements
export const approveRequest = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    reviewerUserId: v.string(),
    reviewerUserName: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Approval request not found");
    if (request.status !== "pending") {
      throw new Error(`Request has already been ${request.status}`);
    }

    const now = new Date().toISOString();

    if (request.type === "transfer") {
      // 1. Fetch Source
      let fromSource: any = null;
      if (request.sourceLocationType === "warehouse" && request.sourceLocationId) {
        fromSource = await ctx.db.get(request.sourceLocationId as any);
      } else if (request.sourceLocationId) {
        fromSource = await ctx.db.get(request.sourceLocationId as any);
      }
      if (!fromSource) throw new Error("Source location not found");

      // 2. Fetch Destination
      let toDest: any = null;
      if (request.destinationLocationType === "store" && request.destinationLocationId) {
        toDest = await ctx.db.get(request.destinationLocationId as any);
      } else if (request.destinationLocationId) {
        toDest = await ctx.db.get(request.destinationLocationId as any);
      }
      if (!toDest) throw new Error("Destination location not found");

      const sourceStock = { ...(fromSource.stock || {}) };
      const destStock = { ...(toDest.stock || {}) };

      // Validate source stock
      for (const item of request.items) {
        if (item.quantity <= 0) continue;
        const available = sourceStock[item.productId] || 0;
        if (available < item.quantity) {
          throw new Error(
            `Insufficient stock in ${fromSource.name} for ${item.productName}. Available: ${available}, Required: ${item.quantity}`
          );
        }
      }

      // Apply transfer
      for (const item of request.items) {
        if (item.quantity <= 0) continue;
        sourceStock[item.productId] = (sourceStock[item.productId] || 0) - item.quantity;
        destStock[item.productId] = (destStock[item.productId] || 0) + item.quantity;
      }

      await ctx.db.patch(fromSource._id, { stock: sourceStock });
      await ctx.db.patch(toDest._id, { stock: destStock });

      await ctx.db.insert("auditLogs", {
        clientId: request.clientId,
        actorId: args.reviewerUserId,
        actorName: args.reviewerUserName,
        role: "owner",
        action: "TRANSFER_APPROVED",
        description: `Approved transfer of ${request.items.reduce((s, it) => s + it.quantity, 0)} units from ${fromSource.name} to ${toDest.name} (Requested by ${request.requestedByUserName})`,
        target: request._id,
        timestamp: now,
      });
    } else if (request.type === "direct_purchase") {
      // Direct Purchase inbound to Store or Warehouse
      let destination: any = null;
      if (request.destinationLocationId) {
        destination = await ctx.db.get(request.destinationLocationId as any);
      }
      if (!destination) throw new Error("Destination location not found");

      const currentStock = { ...(destination.stock || {}) };
      for (const item of request.items) {
        if (item.quantity <= 0) continue;
        currentStock[item.productId] = (currentStock[item.productId] || 0) + item.quantity;
      }

      await ctx.db.patch(destination._id, { stock: currentStock });

      await ctx.db.insert("auditLogs", {
        clientId: request.clientId,
        actorId: args.reviewerUserId,
        actorName: args.reviewerUserName,
        role: "owner",
        action: "DIRECT_PURCHASE_APPROVED",
        description: `Approved direct purchase of ${request.items.reduce((s, it) => s + it.quantity, 0)} units into ${destination.name} (Supplier: ${request.supplierName || "Direct"}, Requested by ${request.requestedByUserName})`,
        target: request._id,
        timestamp: now,
      });
    }

    // Mark as approved
    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewedByUserId: args.reviewerUserId,
      reviewedByUserName: args.reviewerUserName,
      reviewedAt: now,
    });

    return { success: true, updatedRequest: await ctx.db.get(args.requestId) };
  },
});

// Reject an approval request
export const rejectRequest = mutation({
  args: {
    requestId: v.id("approvalRequests"),
    reviewerUserId: v.string(),
    reviewerUserName: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Approval request not found");
    if (request.status !== "pending") {
      throw new Error(`Request has already been ${request.status}`);
    }

    const now = new Date().toISOString();

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      reviewedByUserId: args.reviewerUserId,
      reviewedByUserName: args.reviewerUserName,
      reviewedAt: now,
      notes: args.reason ? `${request.notes ? request.notes + " | " : ""}Rejection reason: ${args.reason}` : request.notes,
    });

    await ctx.db.insert("auditLogs", {
      clientId: request.clientId,
      actorId: args.reviewerUserId,
      actorName: args.reviewerUserName,
      role: "owner",
      action: request.type === "transfer" ? "TRANSFER_REJECTED" : "DIRECT_PURCHASE_REJECTED",
      description: `Rejected ${request.type} request (Requested by ${request.requestedByUserName})${args.reason ? `: ${args.reason}` : ""}`,
      target: request._id,
      timestamp: now,
    });

    return { success: true, updatedRequest: await ctx.db.get(args.requestId) };
  },
});

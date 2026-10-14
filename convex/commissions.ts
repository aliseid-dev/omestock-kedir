import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all commission settlements for an organization
export const getCommissionSettlements = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("commissionSettlements")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Settle commission for a staff member
export const settleStaffCommission = mutation({
  args: {
    clientId: v.id("clients"),
    staffId: v.string(),
    staffName: v.string(),
    amount: v.number(),
    paymentMethod: v.string(), // "Cash" | "Banking" | "Telebirr"
    bankProvider: v.optional(v.string()),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    settledByUserId: v.string(),
    settledByUserName: v.string(),
    saleIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const allSales = await ctx.db
      .query("sales")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Resolve user to find all associated IDs (Convex _id, Clerk userId, staffName)
    const user = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(
          q.eq(q.field("_id"), args.staffId as any),
          q.eq(q.field("userId"), args.staffId),
          q.eq(q.field("name"), args.staffName)
        )
      )
      .first();

    const staffIdSet = new Set<string>([args.staffId]);
    if (user) {
      if (user._id) staffIdSet.add(String(user._id));
      if (user.userId) staffIdSet.add(String(user.userId));
    }
    const targetName = (args.staffName || user?.name || "").trim().toLowerCase();

    // If explicit saleIds are provided, match by those sale IDs too
    const explicitSaleIdSet = args.saleIds && args.saleIds.length > 0
      ? new Set(args.saleIds.map(String))
      : null;

    // Find all unsettled sales for this staff member
    const salesToSettle = allSales.filter((s) => {
      if (s.commissionSettled) return false;
      const commissionVal = s.commission ?? 0;
      if (commissionVal <= 0) return false;

      if (explicitSaleIdSet && (explicitSaleIdSet.has(String(s._id)) || explicitSaleIdSet.has(s._id as any))) {
        return true;
      }

      const idMatch = s.staffId && staffIdSet.has(s.staffId);
      const nameMatch = Boolean(
        targetName && s.staffName && s.staffName.trim().toLowerCase() === targetName
      );
      return idMatch || nameMatch;
    });

    const now = new Date().toISOString();

    // Create settlement record
    const settlementId = await ctx.db.insert("commissionSettlements", {
      clientId: args.clientId,
      staffId: args.staffId,
      staffName: args.staffName,
      amount: args.amount,
      salesCount: salesToSettle.length,
      paymentMethod: args.paymentMethod,
      bankProvider: args.bankProvider,
      reference: args.reference,
      notes: args.notes,
      settledByUserId: args.settledByUserId,
      settledByUserName: args.settledByUserName,
      createdAt: now,
    });

    // Mark sales as settled
    for (const sale of salesToSettle) {
      await ctx.db.patch(sale._id, {
        commissionSettled: true,
        commissionSettledAt: now,
        commissionSettlementId: settlementId,
      });
    }

    // Update user record if exists
    if (user) {
      const prevTotal = user.totalCommissionSettled || 0;
      await ctx.db.patch(user._id, {
        lastCommissionSettledAt: now,
        totalCommissionSettled: prevTotal + args.amount,
      });
    }

    // Log in audit trail
    await ctx.db.insert("auditLogs", {
      clientId: args.clientId,
      actorId: args.settledByUserId,
      actorName: args.settledByUserName,
      role: "owner",
      action: "COMMISSION_SETTLED",
      description: `Settled ETB ${args.amount.toLocaleString()} commission for ${args.staffName} (${salesToSettle.length} sales) via ${args.paymentMethod}${args.reference ? ` (Ref: ${args.reference})` : ""}`,
      target: args.staffName,
      timestamp: now,
    });

    return {
      success: true,
      settlementId,
      settledAmount: args.amount,
      salesCount: salesToSettle.length,
    };
  },
});

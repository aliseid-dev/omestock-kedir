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
  },
  handler: async (ctx, args) => {
    const allSales = await ctx.db
      .query("sales")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Find all unsettled sales for this staff member
    const salesToSettle = allSales.filter((s) => {
      const isStaffMatch =
        s.staffId === args.staffId ||
        (s.staffName && args.staffName && s.staffName.toLowerCase() === args.staffName.toLowerCase());
      const hasCommission = (s.commission ?? 0) > 0;
      const isUnsettled = !s.commissionSettled;
      return isStaffMatch && hasCommission && isUnsettled;
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

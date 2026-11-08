import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Retrieve all restock records for an organization
export const getRestocks = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restocks")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Record a new restock and update destination location stock in a single atomic transaction
export const recordRestock = mutation({
  args: {
    clientId: v.id("clients"),
    destinationType: v.string(), // "warehouse" | "store"
    destinationId: v.string(),
    destinationName: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.string(),
        productCode: v.optional(v.string()),
        category: v.optional(v.string()),
        quantity: v.number(),
        costPerUnit: v.optional(v.number()),
        sellingPrice: v.optional(v.number()),
        unit: v.optional(v.string()),
      })
    ),
    paymentMethod: v.optional(v.string()),
    supplierName: v.optional(v.string()),
    notes: v.optional(v.string()),
    recordedBy: v.optional(v.string()),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const effectiveDate = args.date || now.split("T")[0];

    // 1. Update destination stock
    if (args.destinationType === "warehouse") {
      const wh = await ctx.db.get(args.destinationId as any);
      if (wh) {
        const stock = { ...((wh as any).stock || {}) };
        for (const item of args.items) {
          if (item.quantity <= 0) continue;
          stock[item.productId] = (stock[item.productId] || 0) + item.quantity;
        }
        await ctx.db.patch(wh._id, { stock });
      }
    } else {
      const st = await ctx.db.get(args.destinationId as any);
      if (st) {
        const stock = { ...((st as any).stock || {}) };
        for (const item of args.items) {
          if (item.quantity <= 0) continue;
          stock[item.productId] = (stock[item.productId] || 0) + item.quantity;
        }
        await ctx.db.patch(st._id, { stock });
      }
    }

    // 2. Insert restock record
    const totalUnits = args.items.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
    const totalCost = args.items.reduce(
      (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.costPerUnit) || 0),
      0
    );

    const restockId = await ctx.db.insert("restocks", {
      clientId: args.clientId,
      destinationType: args.destinationType,
      destinationId: args.destinationId,
      destinationName: args.destinationName,
      items: args.items,
      totalUnits,
      totalCost: totalCost > 0 ? totalCost : undefined,
      paymentMethod: args.paymentMethod || "Cash",
      supplierName: args.supplierName || undefined,
      notes: args.notes || undefined,
      recordedBy: args.recordedBy || "Store Owner",
      date: effectiveDate,
      createdAt: now,
    });

    // 3. Log audit action
    try {
      await ctx.db.insert("auditLogs", {
        clientId: args.clientId,
        actorId: "owner",
        actorName: args.recordedBy || "Store Owner",
        role: "owner",
        action: "RESTOCK_RECORDED",
        description: `Restocked ${totalUnits} units across ${args.items.length} item(s) to ${args.destinationName}`,
        target: args.destinationName,
        timestamp: now,
      });
    } catch (auditErr) {
      console.warn("Audit log insert warning:", auditErr);
    }

    return restockId;
  },
});

// Delete a restock entry (optionally without rolling back stock, or as an entry cleanup)
export const deleteRestock = mutation({
  args: {
    restockId: v.id("restocks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.restockId);
    return true;
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Retrieve all logged expenses for an organization
export const getExpenses = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("expenses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Add a new expense record in real-time
export const addExpense = mutation({
  args: {
    clientId: v.id("clients"),
    storeId: v.optional(v.string()),
    category: v.string(),
    amount: v.number(),
    note: v.optional(v.string()),
    date: v.optional(v.string()),
    recordedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const effectiveDate = args.date || now.split("T")[0];

    const expenseId = await ctx.db.insert("expenses", {
      clientId: args.clientId,
      storeId: args.storeId,
      category: args.category.trim(),
      amount: Math.max(0, args.amount),
      note: args.note?.trim() || undefined,
      date: effectiveDate,
      recordedBy: args.recordedBy?.trim() || "Store Owner",
      createdAt: now,
    });

    return expenseId;
  },
});

// Delete an expense record
export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.expenseId);
    return true;
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get audit trail logs for an organization
export const getAuditLogs = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .take(100);
  },
});

// Record an audit log entry
export const logAction = mutation({
  args: {
    clientId: v.id("clients"),
    actorId: v.string(),
    actorName: v.string(),
    role: v.string(),
    action: v.string(),
    description: v.string(),
    target: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("auditLogs", {
      clientId: args.clientId,
      actorId: args.actorId,
      actorName: args.actorName,
      role: args.role,
      action: args.action,
      description: args.description,
      target: args.target,
      timestamp: now,
    });
  },
});

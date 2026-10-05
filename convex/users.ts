import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper to generate unique 6-digit alphanumeric uppercase company code
function generateCompanyCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars (I, O, 0, 1)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get user profile by Clerk User ID
export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) return null;

    const client = await ctx.db.get(user.clientId);
    return {
      ...user,
      client,
    };
  },
});

// Check if a 6-digit company code exists
export const getOrgByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const formatted = args.code.trim().toUpperCase();
    if (formatted.length !== 6) return null;
    return await ctx.db
      .query("clients")
      .withIndex("by_companyCode", (q) => q.eq("companyCode", formatted))
      .first();
  },
});

// Owner Onboarding Setup: Creates company, company code, defaults, and user
export const createOwner = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    businessName: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate unique 6-digit code
    let code = generateCompanyCode();
    let existing = await ctx.db
      .query("clients")
      .withIndex("by_companyCode", (q) => q.eq("companyCode", code))
      .first();
    while (existing) {
      code = generateCompanyCode();
      existing = await ctx.db
        .query("clients")
        .withIndex("by_companyCode", (q) => q.eq("companyCode", code))
        .first();
    }

    const now = new Date().toISOString();

    // 1. Create client organization
    const clientId = await ctx.db.insert("clients", {
      name: args.businessName.trim() || "My Business",
      companyCode: code,
      createdAt: now,
    });

    // 2. Create primary warehouse
    await ctx.db.insert("warehouses", {
      clientId,
      name: "Warehouse",
      location: "Warehouse",
      stock: {},
      createdAt: now,
    });

    // 3. Create primary retail store
    await ctx.db.insert("stores", {
      clientId,
      name: "Store 1",
      location: "Store 1",
      stock: {},
      createdAt: now,
    });

    // 4. Create owner user
    const userId = await ctx.db.insert("users", {
      userId: args.userId,
      email: args.email,
      name: args.name || "Owner",
      role: "owner",
      status: "approved",
      clientId,
      createdAt: now,
    });

    const user = await ctx.db.get(userId);
    const client = await ctx.db.get(clientId);

    return { user, client };
  },
});

// Salesperson Onboarding: Link to client via 6-digit company code (Status = Pending)
export const registerSalesperson = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    companyCode: v.string(),
  },
  handler: async (ctx, args) => {
    const formattedCode = args.companyCode.trim().toUpperCase();
    const client = await ctx.db
      .query("clients")
      .withIndex("by_companyCode", (q) => q.eq("companyCode", formattedCode))
      .first();

    if (!client) {
      throw new Error(`Invalid Company Code "${formattedCode}". Please check with your business owner.`);
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        clientId: client._id,
        role: "salesperson",
        status: "pending",
        name: args.name || existing.name,
      });
      return await ctx.db.get(existing._id);
    }

    const userId = await ctx.db.insert("users", {
      userId: args.userId,
      email: args.email,
      name: args.name || "Salesperson",
      role: "salesperson",
      status: "pending",
      clientId: client._id,
      createdAt: now,
    });

    return await ctx.db.get(userId);
  },
});

// Get all staff members for an organization
export const getStaff = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});

// Owner Approves Pending Salesperson
export const approveStaff = mutation({
  args: { staffId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.staffId, { status: "approved" });
    return true;
  },
});

// Owner Rejects Pending Salesperson
export const rejectStaff = mutation({
  args: { staffId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.staffId, { status: "rejected" });
    return true;
  },
});

// Owner Deletes Staff Member
export const deleteStaff = mutation({
  args: { staffId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.staffId);
    return true;
  },
});

// Update Organization Business Name
export const updateBusinessName = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.clientId, { name: args.name.trim() });
    return true;
  },
});

// Delete User Account Record from Convex
export const deleteUserAccount = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) return { success: false, message: "User not found" };

    await ctx.db.delete(user._id);
    return { success: true };
  },
});

// Clear all products, sales, audit logs, and reset stock to start fresh
export const clearOrganizationData = mutation({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    // 1. Delete all sales for this client
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const sale of sales) {
      await ctx.db.delete(sale._id);
    }

    // 2. Delete all products for this client
    const products = await ctx.db
      .query("products")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const p of products) {
      await ctx.db.delete(p._id);
    }

    // 3. Delete all audit logs for this client
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const l of logs) {
      await ctx.db.delete(l._id);
    }

    // 3b. Delete all approval requests for this client
    const approvals = await ctx.db
      .query("approvalRequests")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const a of approvals) {
      await ctx.db.delete(a._id);
    }

    // 4. Reset stock to empty {} in warehouses
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const wh of warehouses) {
      await ctx.db.patch(wh._id, { stock: {} });
    }

    // 5. Reset stock to empty {} in stores
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const st of stores) {
      await ctx.db.patch(st._id, { stock: {} });
    }

    return { success: true, message: "Organization inventory and sales cleared successfully." };
  },
});

// Wipe current client organization and all associated users to start onboarding fresh
export const wipeClientAndReset = mutation({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const s of sales) await ctx.db.delete(s._id);

    const products = await ctx.db
      .query("products")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const p of products) await ctx.db.delete(p._id);

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const l of logs) await ctx.db.delete(l._id);

    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const wh of warehouses) await ctx.db.delete(wh._id);

    const stores = await ctx.db
      .query("stores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const st of stores) await ctx.db.delete(st._id);

    const users = await ctx.db
      .query("users")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const u of users) await ctx.db.delete(u._id);

    await ctx.db.delete(args.clientId);

    return { success: true };
  },
});

// Full wipe: deletes all tables so user can start completely fresh from initial onboarding
export const wipeEntireDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const allSales = await ctx.db.query("sales").collect();
    for (const item of allSales) await ctx.db.delete(item._id);

    const allProducts = await ctx.db.query("products").collect();
    for (const item of allProducts) await ctx.db.delete(item._id);

    const allLogs = await ctx.db.query("auditLogs").collect();
    for (const item of allLogs) await ctx.db.delete(item._id);

    const allWarehouses = await ctx.db.query("warehouses").collect();
    for (const item of allWarehouses) await ctx.db.delete(item._id);

    const allStores = await ctx.db.query("stores").collect();
    for (const item of allStores) await ctx.db.delete(item._id);

    const allUsers = await ctx.db.query("users").collect();
    for (const item of allUsers) await ctx.db.delete(item._id);

    const allClients = await ctx.db.query("clients").collect();
    for (const item of allClients) await ctx.db.delete(item._id);

    return { success: true, message: "Entire database cleared successfully." };
  },
});

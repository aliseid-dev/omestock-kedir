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
      name: "Central Distribution Hub",
      location: "Main Warehouse",
      stock: {},
      createdAt: now,
    });

    // 3. Create primary retail store
    await ctx.db.insert("stores", {
      clientId,
      name: "Retail Store #1",
      location: "Main Branch",
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

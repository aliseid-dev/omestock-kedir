import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations / Clients
  clients: defineTable({
    name: v.string(),
    companyCode: v.string(), // Unique 6-digit uppercase alphanumeric code, e.g. A7X9M2
    createdAt: v.string(),
  }).index("by_companyCode", ["companyCode"]),

  // Staff and Owners (Linked to Clerk via userId)
  users: defineTable({
    userId: v.string(), // Clerk User ID (e.g. user_2...)
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("salesperson")),
    status: v.union(v.literal("approved"), v.literal("pending"), v.literal("rejected")),
    clientId: v.id("clients"),
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_clientId", ["clientId"])
    .index("by_clientId_status", ["clientId", "status"]),

  // Products Catalog
  products: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    category: v.optional(v.string()),
    sellingPrice: v.number(),
    costPrice: v.number(),
    defaultCommissionRate: v.optional(v.number()),
    minStockThreshold: v.optional(v.number()),
    createdAt: v.string(),
  }).index("by_clientId", ["clientId"]),

  // Warehouses (Central Storage)
  warehouses: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    location: v.string(),
    stock: v.any(), // Record<productId, number>
    createdAt: v.string(),
  }).index("by_clientId", ["clientId"]),

  // Retail Stores (Point of Sale Outlets)
  stores: defineTable({
    clientId: v.id("clients"),
    name: v.string(),
    location: v.string(),
    stock: v.any(), // Record<productId, number>
    createdAt: v.string(),
  }).index("by_clientId", ["clientId"]),

  // Sales Records
  sales: defineTable({
    clientId: v.id("clients"),
    storeId: v.id("stores"),
    storeName: v.optional(v.string()),
    receiptNumber: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.string(),
        quantity: v.number(),
        price: v.number(),
        costPrice: v.optional(v.number()),
        subtotal: v.number(),
      })
    ),
    total: v.number(),
    paymentMethod: v.string(), // Cash | Banking | Credit
    paymentStatus: v.string(), // Paid | Unpaid
    bankProvider: v.optional(v.string()),
    bankRef: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    staffId: v.string(),
    staffName: v.string(),
    commission: v.number(),
    createdAt: v.string(),
    settledAt: v.optional(v.string()),
    settledPaymentMethod: v.optional(v.string()),
    settledBankProvider: v.optional(v.string()),
  }).index("by_clientId", ["clientId"]),

  // Audit Logs (Real-time activity trail)
  auditLogs: defineTable({
    clientId: v.id("clients"),
    actorId: v.string(),
    actorName: v.string(),
    role: v.string(),
    action: v.string(),
    description: v.string(),
    target: v.optional(v.string()),
    timestamp: v.string(),
  }).index("by_clientId", ["clientId"]),
});

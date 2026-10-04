import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations / Clients
  clients: defineTable({
    name: v.string(),
    companyCode: v.string(), // Unique 6-digit uppercase alphanumeric code, e.g. A7X9M2
    telegramBotToken: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
    requireApprovalForTransfers: v.optional(v.boolean()),
    requireApprovalForPurchases: v.optional(v.boolean()),
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
    code: v.optional(v.string()), // Item ID / SKU e.g. "SP-001"
    category: v.optional(v.string()),
    unit: v.optional(v.string()), // e.g. "Piece", "Kg", "L", "KIT"
    sellingPrice: v.number(), // Base selling price
    sellingPriceRange: v.optional(v.string()), // e.g. "3500-3700" when price may vary
    minSellingPrice: v.optional(v.number()),
    maxSellingPrice: v.optional(v.number()),
    costPrice: v.number(),
    defaultCommissionRate: v.optional(v.number()),
    minStockThreshold: v.optional(v.number()),
    notes: v.optional(v.string()),
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
    storeId: v.string(), // Store ID or Warehouse ID
    storeName: v.optional(v.string()),
    locationType: v.optional(v.string()), // "store" | "warehouse"
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

  // Stock Transfer & Direct Purchase Approval Requests
  approvalRequests: defineTable({
    clientId: v.id("clients"),
    type: v.union(v.literal("transfer"), v.literal("direct_purchase")),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
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
    reviewedByUserId: v.optional(v.string()),
    reviewedByUserName: v.optional(v.string()),
    reviewedAt: v.optional(v.string()),
    telegramMessageId: v.optional(v.number()),
    telegramChatId: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_clientId", ["clientId"])
    .index("by_clientId_status", ["clientId", "status"]),
});

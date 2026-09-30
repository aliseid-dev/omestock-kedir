import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get sales history for an organization
export const getSales = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    return sales;
  },
});

// Record a new POS Sale
export const recordSale = mutation({
  args: {
    clientId: v.id("clients"),
    storeId: v.id("stores"),
    storeName: v.optional(v.string()),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.string(),
        quantity: v.number(),
        price: v.number(),
        costPrice: v.optional(v.number()),
        subtotal: v.number(),
        commissionAmount: v.optional(v.number()),
      })
    ),
    total: v.number(),
    paymentMethod: v.string(), // "Cash" | "Banking" | "Credit"
    bankProvider: v.optional(v.string()),
    bankRef: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerPhone: v.optional(v.string()),
    staffId: v.string(),
    staffName: v.string(),
    commission: v.number(),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Store not found");

    const stStock = { ...(store.stock || {}) };

    // Deduct stock for each sold item
    for (const item of args.items) {
      const currentQty = stStock[item.productId] || 0;
      stStock[item.productId] = currentQty - item.quantity;
    }

    await ctx.db.patch(args.storeId, { stock: stStock });

    const now = new Date().toISOString();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const saleId = await ctx.db.insert("sales", {
      clientId: args.clientId,
      storeId: args.storeId,
      storeName: args.storeName || store.name,
      receiptNumber: invoiceNumber,
      items: args.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        price: it.price,
        costPrice: it.costPrice,
        subtotal: it.subtotal,
      })),
      total: args.total,
      paymentMethod: args.paymentMethod,
      paymentStatus: args.paymentMethod === "Credit" ? "Unpaid" : "Paid",
      bankProvider: args.bankProvider,
      bankRef: args.bankRef,
      customerName: args.customerName,
      customerPhone: args.customerPhone,
      staffId: args.staffId,
      staffName: args.staffName,
      commission: args.commission,
      createdAt: now,
    });

    return await ctx.db.get(saleId);
  },
});

// Settle an unpaid/credit sale
export const settleCreditSale = mutation({
  args: {
    saleId: v.id("sales"),
    settledPaymentMethod: v.string(),
    settledBankProvider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.saleId, {
      paymentStatus: "Paid",
      paymentMethod: args.settledPaymentMethod,
      bankProvider: args.settledBankProvider,
      settledAt: now,
      settledPaymentMethod: args.settledPaymentMethod,
      settledBankProvider: args.settledBankProvider,
    });
    return true;
  },
});

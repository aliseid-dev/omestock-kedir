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
    storeId: v.string(),
    storeName: v.optional(v.string()),
    locationType: v.optional(v.string()), // "store" | "warehouse"
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
    const location = await ctx.db.get(args.storeId as any);
    if (!location) throw new Error("Selling location (store or warehouse) not found");

    const locStock = { ...((location as any).stock || {}) };

    // Deduct stock for each sold item from the selected store or warehouse
    for (const item of args.items) {
      const currentQty = locStock[item.productId] || 0;
      locStock[item.productId] = currentQty - item.quantity;
    }

    await ctx.db.patch(args.storeId as any, { stock: locStock });

    const now = new Date().toISOString();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const saleId = await ctx.db.insert("sales", {
      clientId: args.clientId,
      storeId: args.storeId,
      storeName: args.storeName || (location as any)?.name || "Store",
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

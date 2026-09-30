import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all inventory data (products, warehouses, stores) for an organization
export const getInventory = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const stores = await ctx.db
      .query("stores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    return {
      products,
      warehouses,
      stores,
    };
  },
});

// Create a new product in the catalog and initialize stock to 0 in all locations
export const createProduct = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
    category: v.optional(v.string()),
    sellingPrice: v.number(),
    costPrice: v.number(),
    defaultCommissionRate: v.optional(v.number()),
    minStockThreshold: v.optional(v.number()),
    initialWarehouseId: v.optional(v.id("warehouses")),
    initialStoreId: v.optional(v.id("stores")),
    initialQuantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const productId = await ctx.db.insert("products", {
      clientId: args.clientId,
      name: args.name.trim(),
      category: args.category?.trim() || "General",
      sellingPrice: args.sellingPrice,
      costPrice: args.costPrice,
      defaultCommissionRate: args.defaultCommissionRate ?? 5,
      minStockThreshold: args.minStockThreshold ?? 10,
      createdAt: now,
    });

    // Initialize stock across all client warehouses and stores
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const wh of warehouses) {
      const stock = wh.stock || {};
      const initial = (args.initialWarehouseId && args.initialWarehouseId === wh._id) ? (args.initialQuantity || 0) : 0;
      stock[productId] = initial;
      await ctx.db.patch(wh._id, { stock });
    }

    const stores = await ctx.db
      .query("stores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    for (const st of stores) {
      const stock = st.stock || {};
      const initial = (args.initialStoreId && args.initialStoreId === st._id) ? (args.initialQuantity || 0) : 0;
      stock[productId] = initial;
      await ctx.db.patch(st._id, { stock });
    }

    return await ctx.db.get(productId);
  },
});

// Update product information
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    sellingPrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    defaultCommissionRate: v.optional(v.number()),
    minStockThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { productId, ...patchData } = args;
    const cleanPatch: Record<string, any> = {};

    if (patchData.name !== undefined) cleanPatch.name = patchData.name.trim();
    if (patchData.category !== undefined) cleanPatch.category = patchData.category.trim();
    if (patchData.sellingPrice !== undefined) cleanPatch.sellingPrice = patchData.sellingPrice;
    if (patchData.costPrice !== undefined) cleanPatch.costPrice = patchData.costPrice;
    if (patchData.defaultCommissionRate !== undefined) cleanPatch.defaultCommissionRate = patchData.defaultCommissionRate;
    if (patchData.minStockThreshold !== undefined) cleanPatch.minStockThreshold = patchData.minStockThreshold;

    await ctx.db.patch(productId, cleanPatch);
    return await ctx.db.get(productId);
  },
});

// Delete a product from catalog
export const deleteProduct = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.productId);
    return true;
  },
});

// Atomically transfer items between Warehouses and Retail Stores
export const transferStock = mutation({
  args: {
    fromWarehouseId: v.optional(v.id("warehouses")),
    fromStoreId: v.optional(v.id("stores")),
    toStoreId: v.optional(v.id("stores")),
    toWarehouseId: v.optional(v.id("warehouses")),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.optional(v.string()),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let fromSource: any = null;
    let isFromWarehouse = false;

    if (args.fromWarehouseId) {
      fromSource = await ctx.db.get(args.fromWarehouseId);
      if (!fromSource) throw new Error("Source warehouse not found");
      isFromWarehouse = true;
    } else if (args.fromStoreId) {
      fromSource = await ctx.db.get(args.fromStoreId);
      if (!fromSource) throw new Error("Source store not found");
      isFromWarehouse = false;
    } else {
      throw new Error("Must specify source location");
    }

    let toDestination: any = null;
    let isToWarehouse = false;

    if (args.toWarehouseId) {
      if (isFromWarehouse && args.toWarehouseId === args.fromWarehouseId) {
        throw new Error("Source and destination warehouse cannot be the same");
      }
      toDestination = await ctx.db.get(args.toWarehouseId);
      if (!toDestination) throw new Error("Destination warehouse not found");
      isToWarehouse = true;
    } else if (args.toStoreId) {
      if (!isFromWarehouse && args.toStoreId === args.fromStoreId) {
        throw new Error("Source and destination store cannot be the same");
      }
      toDestination = await ctx.db.get(args.toStoreId);
      if (!toDestination) throw new Error("Destination store not found");
      isToWarehouse = false;
    } else {
      throw new Error("Must specify destination warehouse or store");
    }

    const sourceStock = { ...(fromSource.stock || {}) };
    const destStock = { ...(toDestination.stock || {}) };

    // Validate available stock for all transfer items
    for (const item of args.items) {
      const available = sourceStock[item.productId] || 0;
      if (item.quantity <= 0) continue;
      if (available < item.quantity) {
        throw new Error(
          `Insufficient stock in ${isFromWarehouse ? 'warehouse' : 'store'} for product "${item.productName || item.productId}". Available: ${available}, Requested: ${item.quantity}`
        );
      }
    }

    // Apply transfers atomically
    for (const item of args.items) {
      if (item.quantity <= 0) continue;
      sourceStock[item.productId] = (sourceStock[item.productId] || 0) - item.quantity;
      destStock[item.productId] = (destStock[item.productId] || 0) + item.quantity;
    }

    if (isFromWarehouse) {
      await ctx.db.patch(args.fromWarehouseId!, { stock: sourceStock });
    } else {
      await ctx.db.patch(args.fromStoreId!, { stock: sourceStock });
    }

    if (isToWarehouse) {
      await ctx.db.patch(args.toWarehouseId!, { stock: destStock });
    } else {
      await ctx.db.patch(args.toStoreId!, { stock: destStock });
    }

    return { success: true };
  },
});

// Record Warehouse Restock / Inbound (single or bulk items)
export const recordWarehouseInbound = mutation({
  args: {
    warehouseId: v.id("warehouses"),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.optional(v.string()),
        quantity: v.number(),
        costPerUnit: v.optional(v.number()),
      })
    ),
    paymentMethod: v.optional(v.string()),
    bankProvider: v.optional(v.string()),
    supplierName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const warehouse = await ctx.db.get(args.warehouseId);
    if (!warehouse) throw new Error("Warehouse not found");

    const whStock = { ...(warehouse.stock || {}) };

    for (const item of args.items) {
      if (item.quantity <= 0) continue;
      whStock[item.productId] = (whStock[item.productId] || 0) + item.quantity;
    }

    await ctx.db.patch(args.warehouseId, { stock: whStock });
    return { success: true };
  },
});

// Record Direct Retail Store Restock / Inbound (single or bulk items)
export const recordDirectPurchase = mutation({
  args: {
    storeId: v.id("stores"),
    items: v.array(
      v.object({
        productId: v.string(),
        productName: v.optional(v.string()),
        quantity: v.number(),
        costPerUnit: v.optional(v.number()),
      })
    ),
    paymentMethod: v.optional(v.string()),
    bankProvider: v.optional(v.string()),
    supplierName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.storeId);
    if (!store) throw new Error("Store not found");

    const stStock = { ...(store.stock || {}) };

    for (const item of args.items) {
      if (item.quantity <= 0) continue;
      stStock[item.productId] = (stStock[item.productId] || 0) + item.quantity;
    }

    await ctx.db.patch(args.storeId, { stock: stStock });
    return { success: true };
  },
});

// Manual Stock Count Override / Adjustment
export const overrideStock = mutation({
  args: {
    locationType: v.string(), // "warehouse" | "store"
    locationId: v.string(),
    productId: v.string(),
    newQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.locationType === "warehouse") {
      const wh = await ctx.db.get(args.locationId as any);
      if (!wh) throw new Error("Warehouse not found");
      const stock = { ...(wh.stock || {}) };
      stock[args.productId] = args.newQuantity;
      await ctx.db.patch(wh._id, { stock });
    } else {
      const st = await ctx.db.get(args.locationId as any);
      if (!st) throw new Error("Store not found");
      const stock = { ...(st.stock || {}) };
      stock[args.productId] = args.newQuantity;
      await ctx.db.patch(st._id, { stock });
    }
    return true;
  },
});

// Add New Retail Store Branch
export const addStore = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("stores", {
      clientId: args.clientId,
      name: args.name.trim(),
      location: args.location.trim() || "Main Branch",
      stock: {},
      createdAt: now,
    });
  },
});

// Delete Retail Store Branch
export const deleteStore = mutation({
  args: {
    storeId: v.id("stores"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.storeId);
    return true;
  },
});

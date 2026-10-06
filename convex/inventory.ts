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

    const rawWarehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const rawStores = await ctx.db
      .query("stores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Sanitize display names to ensure "Warehouse" and "Store 1"
    const warehouses = rawWarehouses.map((wh) => ({
      ...wh,
      name:
        wh.name === "Central Distribution Hub" ||
        wh.name === "Central Distribution Warehouse" ||
        wh.name === "Central Warehouse" ||
        wh.name.toLowerCase().includes("central distribution") ||
        wh.name.toLowerCase().includes("central warehouse")
          ? "Warehouse"
          : wh.name,
    }));

    const stores = rawStores.map((st) => ({
      ...st,
      name:
        st.name === "Retail Store #1" ||
        st.name === "Main Branch" ||
        st.name === "Store #1"
          ? "Store 1"
          : st.name,
    }));

    return {
      products,
      warehouses,
      stores,
    };
  },
});

// Auto-normalize legacy location names in database
export const normalizeLocationNames = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const wh of warehouses) {
      if (
        wh.name === "Central Distribution Hub" ||
        wh.name === "Central Distribution Warehouse" ||
        wh.name === "Central Warehouse" ||
        wh.name.toLowerCase().includes("central distribution") ||
        wh.name.toLowerCase().includes("central warehouse")
      ) {
        await ctx.db.patch(wh._id, { name: "Warehouse" });
      }
    }
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();
    for (const st of stores) {
      if (
        st.name === "Retail Store #1" ||
        st.name === "Main Branch" ||
        st.name === "Store #1"
      ) {
        await ctx.db.patch(st._id, { name: "Store 1" });
      }
    }

    // Clean up ghost warehouse zero-stock entries (items with 0 stock that only belong to the store)
    for (const wh of warehouses) {
      if (wh.stock && Object.keys(wh.stock).length > 15) {
        const cleanedWhStock: Record<string, number> = {};
        for (const [prodId, qty] of Object.entries(wh.stock)) {
          if ((qty as number) > 0) {
            cleanedWhStock[prodId] = qty as number;
          } else {
            // Keep 0-stock only if it is genuinely a warehouse product (e.g. Gas Cylinders)
            try {
              const prod = await ctx.db.get(prodId as any);
              if (prod && (prod.category?.toLowerCase().includes("gas") || prod.name?.toLowerCase().includes("gas"))) {
                cleanedWhStock[prodId] = 0;
              }
            } catch {
              // Ignore invalid ID
            }
          }
        }
        await ctx.db.patch(wh._id, { stock: cleanedWhStock });
      }
    }
  },
});

// Create a new product in the catalog and initialize stock to 0 in all locations
export const createProduct = mutation({
  args: {
    clientId: v.id("clients"),
    name: v.string(),
    code: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.optional(v.string()),
    sellingPrice: v.number(),
    sellingPriceRange: v.optional(v.string()),
    minSellingPrice: v.optional(v.number()),
    maxSellingPrice: v.optional(v.number()),
    costPrice: v.number(),
    defaultCommissionRate: v.optional(v.number()),
    minStockThreshold: v.optional(v.number()),
    notes: v.optional(v.string()),
    initialWarehouseId: v.optional(v.id("warehouses")),
    initialStoreId: v.optional(v.id("stores")),
    initialQuantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const isOil = (args.name + " " + (args.category || "")).toLowerCase().includes("oil");
    const defaultComm = isOil ? 0.5 : 2.5;

    const productId = await ctx.db.insert("products", {
      clientId: args.clientId,
      name: args.name.trim(),
      code: args.code?.trim() || undefined,
      category: args.category?.trim() || "General",
      unit: args.unit?.trim() || "Piece",
      sellingPrice: args.sellingPrice,
      sellingPriceRange: args.sellingPriceRange?.trim() || undefined,
      minSellingPrice: args.minSellingPrice,
      maxSellingPrice: args.maxSellingPrice,
      costPrice: args.costPrice,
      defaultCommissionRate: args.defaultCommissionRate ?? defaultComm,
      minStockThreshold: args.minStockThreshold ?? 5,
      notes: args.notes?.trim() || undefined,
      createdAt: now,
    });

    // Initialize stock only in the explicitly chosen location
    if (args.initialWarehouseId) {
      const wh = await ctx.db.get(args.initialWarehouseId);
      if (wh) {
        const stock = { ...(wh.stock || {}) };
        stock[productId] = Math.max(0, args.initialQuantity || 0);
        await ctx.db.patch(wh._id, { stock });
      }
    }

    if (args.initialStoreId) {
      const st = await ctx.db.get(args.initialStoreId);
      if (st) {
        const stock = { ...(st.stock || {}) };
        stock[productId] = Math.max(0, args.initialQuantity || 0);
        await ctx.db.patch(st._id, { stock });
      }
    }

    return await ctx.db.get(productId);
  },
});

// Update product information
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    category: v.optional(v.string()),
    unit: v.optional(v.string()),
    sellingPrice: v.optional(v.number()),
    sellingPriceRange: v.optional(v.string()),
    minSellingPrice: v.optional(v.number()),
    maxSellingPrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    defaultCommissionRate: v.optional(v.number()),
    minStockThreshold: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { productId, ...patchData } = args;
    const cleanPatch: Record<string, any> = {};

    if (patchData.name !== undefined) cleanPatch.name = patchData.name.trim();
    if (patchData.code !== undefined) cleanPatch.code = patchData.code.trim();
    if (patchData.category !== undefined) cleanPatch.category = patchData.category.trim();
    if (patchData.unit !== undefined) cleanPatch.unit = patchData.unit.trim();
    if (patchData.sellingPrice !== undefined) cleanPatch.sellingPrice = patchData.sellingPrice;
    if (patchData.sellingPriceRange !== undefined) cleanPatch.sellingPriceRange = patchData.sellingPriceRange.trim();
    if (patchData.minSellingPrice !== undefined) cleanPatch.minSellingPrice = patchData.minSellingPrice;
    if (patchData.maxSellingPrice !== undefined) cleanPatch.maxSellingPrice = patchData.maxSellingPrice;
    if (patchData.costPrice !== undefined) cleanPatch.costPrice = patchData.costPrice;
    if (patchData.defaultCommissionRate !== undefined) cleanPatch.defaultCommissionRate = patchData.defaultCommissionRate;
    if (patchData.minStockThreshold !== undefined) cleanPatch.minStockThreshold = patchData.minStockThreshold;
    if (patchData.notes !== undefined) cleanPatch.notes = patchData.notes.trim();

    await ctx.db.patch(productId, cleanPatch);
    return await ctx.db.get(productId);
  },
});

// Seed sample 15 items from Kaya Yasmin Auto Parts dataset
export const seedSampleInventory = mutation({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const stores = await ctx.db
      .query("stores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const primaryWh = warehouses[0];
    const primarySt = stores[0];

    const SAMPLE_ITEMS = [
      { code: "SP-001", name: "12 KG GAS nok", category: "Gas Cylinders", unit: "Kg", costPrice: 2950, sellingPrice: 3500, sellingPriceRange: "3500", minStockThreshold: 2, whStock: 76, stStock: 20 },
      { code: "SP-002", name: "12 KG GAS giyon", category: "Gas Cylinders", unit: "Kg", costPrice: 3300, sellingPrice: 3500, sellingPriceRange: "3500-3700", minStockThreshold: 2, whStock: 149, stStock: 23 },
      { code: "SP-003", name: "6 KG GAS", category: "Gas Cylinders", unit: "Kg", costPrice: 1300, sellingPrice: 1800, sellingPriceRange: "1800-2000", minStockThreshold: 2, whStock: 30, stStock: 9 },
      { code: "SP-004", name: "15kg Gas Cylinder", category: "Gas Cylinders", unit: "Kg", costPrice: 4000, sellingPrice: 4500, sellingPriceRange: "4500-5000", minStockThreshold: 2, whStock: 38, stStock: 6 },
      { code: "SP-005", name: "22 KG GAS", category: "Gas Cylinders", unit: "Kg", costPrice: 5500, sellingPrice: 6500, sellingPriceRange: "6500-7000", minStockThreshold: 1, whStock: 25, stStock: 10 },
      { code: "SP-006", name: "64010 Fuel filter rinken", category: "Filters", unit: "Piece", costPrice: 400, sellingPrice: 500, sellingPriceRange: "500-600", minStockThreshold: 5, whStock: 40, stStock: 5 },
      { code: "SP-007", name: "FLANja lokal DX", category: "Filters", unit: "Piece", costPrice: 1800, sellingPrice: 2500, sellingPriceRange: "2500-2800", minStockThreshold: 6, whStock: 18, stStock: 6 },
      { code: "SP-008", name: "ISUZU fuel filter", category: "Filters", unit: "Piece", costPrice: 400, sellingPrice: 600, sellingPriceRange: "600-750", minStockThreshold: 5, whStock: 35, stStock: 7 },
      { code: "SP-009", name: "Coolant 1L", category: "Coolants & Fluids", unit: "L", costPrice: 350, sellingPrice: 500, sellingPriceRange: "500-600", minStockThreshold: 5, whStock: 50, stStock: 11 },
      { code: "SP-010", name: "Coolant 4L", category: "Coolants & Fluids", unit: "L", costPrice: 1100, sellingPrice: 1200, sellingPriceRange: "1200-1800", minStockThreshold: 5, whStock: 28, stStock: 12 },
      { code: "SP-011", name: "OSCAR BREAK FLUD", category: "Brake Fluids", unit: "Piece", costPrice: 150, sellingPrice: 300, sellingPriceRange: "300-400", minStockThreshold: 5, whStock: 60, stStock: 22 },
      { code: "SP-012", name: "Asmico break fluid 1/2", category: "Brake Fluids", unit: "Piece", costPrice: 450, sellingPrice: 500, sellingPriceRange: "500-700", minStockThreshold: 5, whStock: 30, stStock: 10 },
      { code: "SP-016", name: "SDK 30002 oil filter", category: "Oil Filters", unit: "Piece", costPrice: 350, sellingPrice: 500, sellingPriceRange: "500-650", minStockThreshold: 5, whStock: 80, stStock: 40 },
      { code: "SP-030", name: "Rubia 1L", category: "Engine Oils (1L)", unit: "L", costPrice: 1100, sellingPrice: 1200, sellingPriceRange: "1200-1500", minStockThreshold: 5, whStock: 24, stStock: 8 },
      { code: "SP-035", name: "Delo 4L", category: "Engine Oils (4L)", unit: "L", costPrice: 5000, sellingPrice: 5500, sellingPriceRange: "5500-6000", minStockThreshold: 3, whStock: 16, stStock: 4 },
    ];

    const now = new Date().toISOString();
    const existingProducts = await ctx.db
      .query("products")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const whStock = primaryWh ? { ...(primaryWh.stock || {}) } : {};
    const stStock = primarySt ? { ...(primarySt.stock || {}) } : {};

    for (const item of SAMPLE_ITEMS) {
      let prod = existingProducts.find((p) => p.code === item.code || p.name === item.name);
      let prodId: any;

      if (prod) {
        prodId = prod._id;
        await ctx.db.patch(prodId, {
          code: item.code,
          unit: item.unit,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          sellingPriceRange: item.sellingPriceRange,
          minStockThreshold: item.minStockThreshold,
        });
      } else {
        const isOil = (item.name + " " + item.category).toLowerCase().includes("oil");
        prodId = await ctx.db.insert("products", {
          clientId: args.clientId,
          name: item.name,
          code: item.code,
          category: item.category,
          unit: item.unit,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          sellingPriceRange: item.sellingPriceRange,
          defaultCommissionRate: isOil ? 0.5 : 2.5,
          minStockThreshold: item.minStockThreshold,
          createdAt: now,
        });
      }

      if (primaryWh) {
        whStock[prodId] = item.whStock;
      }
      if (primarySt) {
        stStock[prodId] = item.stStock;
      }
    }

    if (primaryWh) {
      await ctx.db.patch(primaryWh._id, { stock: whStock });
    }
    if (primarySt) {
      await ctx.db.patch(primarySt._id, { stock: stStock });
    }

    return { success: true, count: SAMPLE_ITEMS.length };
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
      location: args.location.trim() || args.name.trim() || "Store 1",
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

// Bulk Import Inventory from Excel file
export const bulkImportInventory = mutation({
  args: {
    clientId: v.id("clients"),
    items: v.array(
      v.object({
        name: v.string(),
        code: v.optional(v.string()),
        category: v.optional(v.string()),
        unit: v.optional(v.string()),
        costPrice: v.optional(v.number()),
        sellingPrice: v.number(),
        sellingPriceRange: v.optional(v.string()),
        minStockThreshold: v.optional(v.number()),
        defaultCommissionRate: v.optional(v.number()),
        warehouseStock: v.optional(v.number()),
        storeStock: v.optional(v.number()),
      })
    ),
    clearExisting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // 1. Fetch or create Warehouse & Store for this client
    let warehouses = await ctx.db
      .query("warehouses")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (warehouses.length === 0) {
      const whId = await ctx.db.insert("warehouses", {
        clientId: args.clientId,
        name: "Warehouse",
        location: "Central Storage",
        stock: {},
        createdAt: now,
      });
      const newWh = await ctx.db.get(whId);
      if (newWh) warehouses = [newWh];
    }

    let stores = await ctx.db
      .query("stores")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    if (stores.length === 0) {
      const stId = await ctx.db.insert("stores", {
        clientId: args.clientId,
        name: "Store 1",
        location: "Retail Shop",
        stock: {},
        createdAt: now,
      });
      const newSt = await ctx.db.get(stId);
      if (newSt) stores = [newSt];
    }

    const primaryWh = warehouses[0];
    const primarySt = stores[0];

    // 2. If clearExisting is requested, wipe existing products, sales, approvals and reset stocks
    if (args.clearExisting) {
      const existingProducts = await ctx.db
        .query("products")
        .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
        .collect();
      for (const p of existingProducts) {
        await ctx.db.delete(p._id);
      }

      const existingSales = await ctx.db
        .query("sales")
        .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
        .collect();
      for (const s of existingSales) {
        await ctx.db.delete(s._id);
      }

      const approvals = await ctx.db
        .query("approvalRequests")
        .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
        .collect();
      for (const a of approvals) {
        await ctx.db.delete(a._id);
      }

      for (const wh of warehouses) {
        await ctx.db.patch(wh._id, { stock: {} });
      }
      for (const st of stores) {
        await ctx.db.patch(st._id, { stock: {} });
      }
    }

    // 3. Fetch products to update or insert
    const currentProducts = await ctx.db
      .query("products")
      .withIndex("by_clientId", (q) => q.eq("clientId", args.clientId))
      .collect();

    const whStock = primaryWh ? { ...(primaryWh.stock || {}) } : {};
    const stStock = primarySt ? { ...(primarySt.stock || {}) } : {};

    let totalWhUnits = 0;
    let totalStUnits = 0;

    for (const item of args.items) {
      const trimmedName = item.name.trim();
      if (!trimmedName) continue;

      const trimmedCode = item.code?.trim();
      const existingProd = currentProducts.find(
        (p) =>
          (trimmedCode && p.code && p.code.toLowerCase() === trimmedCode.toLowerCase()) ||
          p.name.toLowerCase() === trimmedName.toLowerCase()
      );

      const isOil = (trimmedName + " " + (item.category || "")).toLowerCase().includes("oil");
      const defaultCommission =
        item.defaultCommissionRate !== undefined
          ? item.defaultCommissionRate
          : isOil
          ? 0.5
          : 2.5;

      const costPrice = item.costPrice !== undefined ? item.costPrice : 0;
      const sellingPrice =
        item.sellingPrice || (costPrice > 0 ? Math.round(costPrice * 1.25) : 30);
      const minStockThreshold =
        item.minStockThreshold !== undefined ? item.minStockThreshold : 5;
      const unit = item.unit || "Piece";

      let prodId: any;

      if (existingProd) {
        prodId = existingProd._id;
        await ctx.db.patch(prodId, {
          name: trimmedName,
          code: trimmedCode || existingProd.code,
          category: item.category || existingProd.category,
          unit,
          costPrice,
          sellingPrice,
          sellingPriceRange: item.sellingPriceRange || existingProd.sellingPriceRange,
          defaultCommissionRate: defaultCommission,
          minStockThreshold,
        });
      } else {
        prodId = await ctx.db.insert("products", {
          clientId: args.clientId,
          name: trimmedName,
          code: trimmedCode,
          category: item.category || "General",
          unit,
          costPrice,
          sellingPrice,
          sellingPriceRange: item.sellingPriceRange,
          defaultCommissionRate: defaultCommission,
          minStockThreshold,
          createdAt: now,
        });
      }

      if (primaryWh && item.warehouseStock !== undefined) {
        whStock[prodId] = Math.max(0, item.warehouseStock);
        totalWhUnits += Math.max(0, item.warehouseStock);
      }
      if (primarySt && item.storeStock !== undefined) {
        stStock[prodId] = Math.max(0, item.storeStock);
        totalStUnits += Math.max(0, item.storeStock);
      }
    }

    if (primaryWh) {
      await ctx.db.patch(primaryWh._id, { stock: whStock });
    }
    if (primarySt) {
      await ctx.db.patch(primarySt._id, { stock: stStock });
    }

    // 4. Log to Audit Trail
    await ctx.db.insert("auditLogs", {
      clientId: args.clientId,
      actorId: "owner",
      actorName: "Business Owner",
      role: "owner",
      action: "EXCEL_INVENTORY_IMPORTED",
      description: `Bulk imported ${args.items.length} products from Excel spreadsheet (Warehouse: ${totalWhUnits} units, Store: ${totalStUnits} units).`,
      timestamp: now,
    });

    return {
      success: true,
      importedCount: args.items.length,
      warehouseUnits: totalWhUnits,
      storeUnits: totalStUnits,
    };
  },
});

// Auto-detect the latest or active client for scripts and utilities
export const getActiveClient = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("clients").order("desc").first();
  },
});



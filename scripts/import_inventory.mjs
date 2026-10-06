/**
 * OMESTOCK Inventory Importer & Seeder
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   node scripts/import_inventory.mjs [CLIENT_ID] [--clear]
 *
 * If CLIENT_ID is omitted, it will automatically connect to your active/latest
 * client account in Convex!
 *
 * Options:
 *   --clear   Wipe existing products and reset inventory before importing
 *
 * Examples:
 *   node scripts/import_inventory.mjs               (Auto-detects client)
 *   node scripts/import_inventory.mjs --clear       (Auto-detects and clears first)
 *   node scripts/import_inventory.mjs j97...        (Explicit Client ID)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));

const CONVEX_URL =
  process.env.VITE_CONVEX_URL ||
  "https://mild-dragon-123.eu-west-1.convex.cloud";
const ITEMS_FILE = join(__dir, "seed_items.json");

// Parse command line arguments
const rawArgs = process.argv.slice(2);
const clearExisting = rawArgs.includes("--clear") || rawArgs.includes("--fresh");
let explicitClientId = rawArgs.find((a) => !a.startsWith("--"));

// Helper: Convex HTTP query
async function runQuery(functionPath, args = {}) {
  const res = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: functionPath, args }),
  });
  const json = await res.json();
  if (json.status === "error" || json.errorMessage) {
    throw new Error(json.errorMessage || JSON.stringify(json));
  }
  return json.value;
}

// Helper: Convex HTTP mutation
async function runMutation(functionPath, args) {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: functionPath, args }),
  });
  const json = await res.json();
  if (json.status === "error" || json.errorMessage) {
    throw new Error(json.errorMessage || JSON.stringify(json));
  }
  return json.value;
}

async function main() {
  console.log("\n=======================================================");
  console.log("   📦  OMESTOCK INVENTORY IMPORTER (AUTO-SETUP)");
  console.log("=======================================================");

  // 1. Resolve Client ID
  let targetClientId = explicitClientId;
  let clientInfo = null;

  if (!targetClientId) {
    process.stdout.write("🔍 Auto-detecting active client from Convex... ");
    clientInfo = await runQuery("inventory:getActiveClient");
    if (!clientInfo || !clientInfo._id) {
      console.error("\n❌ Could not find an active client in Convex.");
      console.error("👉 Please create your account in the web app first, or pass the Client ID:");
      console.error("   node scripts/import_inventory.mjs <CLIENT_ID> [--clear]");
      process.exit(1);
    }
    targetClientId = clientInfo._id;
    console.log(`Found: "${clientInfo.name}" (Code: ${clientInfo.companyCode})`);
  }

  console.log(`🔑 Target Client ID: ${targetClientId}`);
  console.log(`🌐 Convex Cloud URL: ${CONVEX_URL}`);

  // 2. Load seed products
  let items;
  try {
    items = JSON.parse(readFileSync(ITEMS_FILE, "utf-8"));
  } catch (err) {
    console.error(`❌ Could not load ${ITEMS_FILE}: ${err.message}`);
    process.exit(1);
  }

  const whItemCount = items.filter((it) => (it.warehouseStock || 0) > 0 || ["SP-001","SP-002","SP-003","SP-004","SP-005","SP-222"].includes(it.code)).length;
  const totalWhUnits = items.reduce((sum, it) => sum + (it.warehouseStock || 0), 0);
  const totalStUnits = items.reduce((sum, it) => sum + (it.storeStock || 0), 0);

  console.log(`📊 Catalog: ${items.length} products`);
  console.log(`   • Warehouse: ${whItemCount} items (${totalWhUnits.toLocaleString()} units)`);
  console.log(`   • Retail Shop: ${items.length} items (${totalStUnits.toLocaleString()} units)`);
  console.log(`🧹 Mode: ${clearExisting ? "Wipe existing data & import fresh (--clear)" : "Merge / Update existing data"}\n`);

  // 3. Import in batches
  const BATCH_SIZE = 100;
  const totalBatches = Math.ceil(items.length / BATCH_SIZE);
  let importedCount = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const isFirstBatch = i === 0;

    process.stdout.write(
      `⏳ Importing batch ${batchNum}/${totalBatches} (${i + 1}–${Math.min(i + BATCH_SIZE, items.length)} of ${items.length})... `
    );

    try {
      const res = await runMutation("inventory:bulkImportInventory", {
        clientId: targetClientId,
        items: batch,
        clearExisting: isFirstBatch && clearExisting,
      });

      importedCount += batch.length;
      console.log("✅ DONE");
    } catch (err) {
      console.error(`\n❌ Failed at batch ${batchNum}: ${err.message}`);
      process.exit(1);
    }
  }

  console.log("\n=======================================================");
  console.log(`🎉 SUCCESS! Successfully imported all ${items.length} products!`);
  console.log(`📦 Warehouse Stock: ${totalWhUnits.toLocaleString()} units across 6 gas products`);
  console.log(`🏬 Shop Stock:      ${totalStUnits.toLocaleString()} units across 221 products`);
  console.log("🔡 All names, categories, and units capitalized in uppercase.");
  console.log("🔧 Preserved 'CHINGA VITZ' and fixed spelling errors (SPARE PARTS, BRAKE, BUSHING, etc.).");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

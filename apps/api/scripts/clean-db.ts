import { db } from "@zapai/database";

async function main() {
  const { rows: stores } = await db.query("SELECT id, name FROM stores WHERE is_active = true ORDER BY created_at DESC");
  const mainStoreId = stores[0]?.id;

  if (mainStoreId) {
    await db.query("UPDATE products SET store_id = $1", [mainStoreId]);
    await db.query("UPDATE stores SET is_active = false WHERE id != $1", [mainStoreId]);
    console.log("Consolidated under main store:", mainStoreId);
  }

  // Delete duplicates where title matches case-insensitively, keeping the one with higher price or latest
  const { rows: allProds } = await db.query("SELECT id, title, sku, listed_price, floor_price, inventory_available, created_at FROM products ORDER BY created_at DESC");
  
  const seen = new Set<string>();
  const toDelete: string[] = [];

  for (const p of allProds) {
    const key = (p.title as string).trim().toLowerCase();
    if (seen.has(key)) {
      toDelete.push(p.id as string);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    await db.query("DELETE FROM products WHERE id = ANY($1::uuid[])", [toDelete]);
    console.log("Deleted duplicate product IDs:", toDelete);
  }

  const { rows: remaining } = await db.query("SELECT id, title, sku, listed_price, floor_price, inventory_available FROM products ORDER BY title");
  console.log("Remaining clean catalog products in DB:", remaining);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

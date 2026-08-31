import { db } from "@zapai/database";
import { getShopifyClient } from "./client.ts";
import { logger } from "../../core/logger/index.ts";

export interface ShopifyProductItem {
  id: string;
  shopifyProductId: string;
  shopifyVariantId: string;
  title: string;
  sku: string;
  listedPrice: number;
  floorPrice: number;
  inventoryAvailable: number;
  category: string;
  description: string;
  imageUrl: string | null;
}

export async function fetchShopifyProducts(
  shopDomain: string,
  accessToken: string,
  discountPercentage: number = 15
): Promise<ShopifyProductItem[]> {
  const client = getShopifyClient(shopDomain, accessToken);
  let rawProducts: any[] = [];

  try {
    const res = await client.get("/products.json?limit=250");
    rawProducts = res.data?.products || [];
  } catch (err: any) {
    logger.error({ err: err.message, shopDomain }, "Failed to fetch products from Shopify Admin API");
    throw err;
  }

  const items: ShopifyProductItem[] = [];

  for (const p of rawProducts) {
    const prodTitle = p.title || "Untitled Product";
    const prodCategory = p.product_type || "General";
    const prodDescription = (p.body_html || "").replace(/<[^>]*>?/gm, "").trim();
    const prodImage = p.images?.[0]?.src || p.image?.src || null;

    const variants = p.variants && p.variants.length > 0 ? p.variants : [{}];

    for (let vIdx = 0; vIdx < variants.length; vIdx++) {
      const v = variants[vIdx];
      const variantTitle = v.title && v.title !== "Default Title" ? `${prodTitle} (${v.title})` : prodTitle;
      const listedPrice = Math.max(1, parseFloat(v.price || p.price || "999") || 999);
      const floorPrice = Math.round(listedPrice * (1 - (discountPercentage / 100)));
      const inventory = v.inventory_quantity !== undefined && v.inventory_quantity !== null
        ? Math.max(0, parseInt(v.inventory_quantity, 10))
        : 10;
      const sku = v.sku || `SHOPIFY-${p.id}-${v.id || vIdx}`;
      const shopifyProductId = String(p.id);
      const shopifyVariantId = String(v.id || p.id);

      items.push({
        id: `prod_shp_${p.id}_${v.id || vIdx}`,
        shopifyProductId,
        shopifyVariantId,
        title: variantTitle,
        sku,
        listedPrice,
        floorPrice,
        inventoryAvailable: inventory,
        category: prodCategory,
        description: prodDescription,
        imageUrl: prodImage,
      });
    }
  }

  return items;
}

export async function upsertProductsToDb(
  storeId: string,
  items: ShopifyProductItem[],
  shopDomain: string
): Promise<number> {
  let count = 0;

  for (const item of items) {
    const agentSchema = {
      variantId: item.shopifyVariantId,
      title: item.title,
      sku: item.sku,
      listedPrice: item.listedPrice,
      floorPrice: item.floorPrice,
      inventoryAvailable: item.inventoryAvailable,
      attributes: {
        category: item.category,
        description: item.description,
        source: "SHOPIFY",
        shopDomain,
      },
    };

    await db.query(
      `INSERT INTO products (
        store_id, shopify_product_id, shopify_variant_id,
        title, sku, listed_price, floor_price,
        inventory_available, inventory_reserved, inventory_state,
        is_ai_enabled, category, description, image_url, agent_schema,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'AVAILABLE', true, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (store_id, shopify_variant_id) DO UPDATE SET
        title = EXCLUDED.title,
        sku = EXCLUDED.sku,
        listed_price = EXCLUDED.listed_price,
        floor_price = EXCLUDED.floor_price,
        inventory_available = EXCLUDED.inventory_available,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        image_url = COALESCE(EXCLUDED.image_url, products.image_url),
        agent_schema = EXCLUDED.agent_schema,
        is_ai_enabled = true,
        updated_at = NOW()`,
      [
        storeId,
        item.shopifyProductId,
        item.shopifyVariantId,
        item.title,
        item.sku,
        item.listedPrice,
        item.floorPrice,
        item.inventoryAvailable,
        item.category,
        item.description,
        item.imageUrl,
        JSON.stringify(agentSchema),
      ]
    );
    count++;
  }

  return count;
}

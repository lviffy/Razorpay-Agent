import { Router } from "express";
import { db } from "../db/migrate.ts";
import { v4 as uuidv4 } from "uuid";
import type { Request, Response } from "express";

const router = Router();

// GET /api/v1/products — List all catalog products
router.get("/", async (req: Request, res: Response) => {
  try {
    const storeId = req.query.storeId as string | undefined;

    let query = `
      SELECT
        p.id,
        p.store_id,
        s.name as store_name,
        p.shopify_product_id,
        p.shopify_variant_id,
        p.title,
        p.sku,
        p.listed_price,
        p.floor_price,
        p.inventory_available,
        p.inventory_reserved,
        p.inventory_state,
        p.is_ai_enabled,
        p.category,
        p.description,
        p.image_url,
        p.agent_schema,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN stores s ON p.store_id = s.id
    `;
    const params: any[] = [];

    if (storeId) {
      query += ` WHERE p.store_id = $1`;
      params.push(storeId);
    }

    query += ` ORDER BY p.created_at DESC, p.updated_at DESC`;

    const { rows } = await db.query(query, params);

    const products = rows.map((r) => {
      const listedPrice = parseFloat(r.listed_price);
      const floorPrice = parseFloat(r.floor_price);
      const maxDiscountPercent =
        listedPrice > 0 ? Math.round(((listedPrice - floorPrice) / listedPrice) * 100) : 12;

      return {
        id: r.id,
        storeId: r.store_id,
        storeName: r.store_name,
        title: r.title,
        sku: r.sku,
        price: listedPrice,
        minPrice: floorPrice,
        inventory: parseInt(r.inventory_available, 10),
        inventoryReserved: parseInt(r.inventory_reserved, 10),
        inventoryState: r.inventory_state,
        provider: r.shopify_product_id.startsWith("mock-prod") ? "ZAPAI" : "SHOPIFY",
        aiSellingEnabled: r.is_ai_enabled ?? true,
        maxDiscountPercent,
        description: r.description || "",
        category: r.category || "General",
        imageUrl: r.image_url,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      };
    });

    return res.json(products);
  } catch (err) {
    console.error("Products list error:", err);
    return res.status(500).json({ error: "Failed to list products" });
  }
});

// POST /api/v1/products — Create a new product
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      sku,
      price,
      minPrice,
      inventory,
      category,
      description,
      storeId = "a0000000-0000-0000-0000-000000000001",
      aiSellingEnabled = true,
    } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ error: "Title and price are required" });
    }

    const listedPrice = Number(price);
    const floorPrice = minPrice ? Number(minPrice) : Math.round(listedPrice * 0.85);
    const stock = inventory ? Number(inventory) : 10;
    const finalSku = sku || `SKU-${Date.now().toString().slice(-6)}`;
    const variantId = `var_${Date.now()}`;
    const shopifyProdId = `prod_${Date.now()}`;

    const agentSchema = {
      variantId,
      title,
      sku: finalSku,
      listedPrice,
      floorPrice,
      inventoryAvailable: stock,
      attributes: {
        category: category || "General",
        description: description || "",
      },
    };

    const { rows } = await db.query(
      `INSERT INTO products (
        store_id, shopify_product_id, shopify_variant_id,
        title, sku, listed_price, floor_price,
        inventory_available, inventory_reserved, inventory_state,
        is_ai_enabled, category, description, agent_schema,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'AVAILABLE', $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        storeId,
        shopifyProdId,
        variantId,
        title,
        finalSku,
        listedPrice,
        floorPrice,
        stock,
        aiSellingEnabled,
        category || "General",
        description || "",
        JSON.stringify(agentSchema),
      ]
    );

    const r = rows[0];
    const createdProduct = {
      id: r.id,
      storeId: r.store_id,
      title: r.title,
      sku: r.sku,
      price: parseFloat(r.listed_price),
      minPrice: parseFloat(r.floor_price),
      inventory: parseInt(r.inventory_available, 10),
      provider: "ZAPAI",
      aiSellingEnabled: r.is_ai_enabled,
      maxDiscountPercent: Math.round(((listedPrice - floorPrice) / listedPrice) * 100),
      description: r.description,
      category: r.category,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };

    return res.status(201).json(createdProduct);
  } catch (err) {
    console.error("Product create error:", err);
    return res.status(500).json({ error: "Failed to create product" });
  }
});

// PATCH /api/v1/products/:id/toggle-ai — Toggle AI selling
router.patch("/:id/toggle-ai", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const { rows } = await db.query(
      `UPDATE products
       SET is_ai_enabled = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [Boolean(enabled), id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Product not found" });
    }

    const r = rows[0];
    return res.json({
      id: r.id,
      aiSellingEnabled: r.is_ai_enabled,
      updatedAt: r.updated_at.toISOString(),
    });
  } catch (err) {
    console.error("Toggle AI error:", err);
    return res.status(500).json({ error: "Failed to update AI state" });
  }
});

// PATCH /api/v1/products/:id — Update product details
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, price, minPrice, inventory, category, description, isAiEnabled } = req.body;

    const { rows } = await db.query(
      `UPDATE products
       SET
         title = COALESCE($1, title),
         listed_price = COALESCE($2, listed_price),
         floor_price = COALESCE($3, floor_price),
         inventory_available = COALESCE($4, inventory_available),
         category = COALESCE($5, category),
         description = COALESCE($6, description),
         is_ai_enabled = COALESCE($7, is_ai_enabled),
         updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [title, price, minPrice, inventory, category, description, isAiEnabled, id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Product update error:", err);
    return res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE /api/v1/products/:id — Delete product
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM products WHERE id = $1", [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error("Product delete error:", err);
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

export default router;

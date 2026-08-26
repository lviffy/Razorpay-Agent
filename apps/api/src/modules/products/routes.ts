import { Router } from "express";
import { db } from "@zapai/database";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";

const router = Router();

const JWT_SECRET = env.JWT_SECRET || "zapai_jwt_secret_neon_auth_2026";

async function getStoreIdFromReq(req: Request): Promise<string | null> {
  const storeIdQuery = req.query.storeId as string | undefined;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (storeIdQuery && uuidRegex.test(storeIdQuery)) {
    return storeIdQuery;
  }

  const storeIdHeader = req.headers["x-store-id"] as string | undefined;
  if (storeIdHeader && uuidRegex.test(storeIdHeader)) {
    return storeIdHeader;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded?.storeId && uuidRegex.test(decoded.storeId)) {
        return decoded.storeId;
      }
      if (decoded?.userId) {
        const { rows } = await db.query(
          "SELECT store_id FROM users WHERE id = $1 LIMIT 1",
          [decoded.userId]
        );
        if (rows[0]?.store_id) return rows[0].store_id;
      }
    } catch {
      // ignore
    }
  }

  const { rows } = await db.query(
    "SELECT id FROM stores WHERE is_active = true ORDER BY created_at DESC LIMIT 1"
  );
  return rows[0]?.id || null;
}

// GET /api/v1/products — List all catalog products
router.get("/", async (req: Request, res: Response) => {
  try {
    const storeId = await getStoreIdFromReq(req);

    let query = `
      SELECT
        p.id,
        p.store_id,
        COALESCE(s.name, 'Native Store') as store_name,
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
      LEFT JOIN stores s ON p.store_id = s.id
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
        provider: r.shopify_product_id && !r.shopify_product_id.startsWith("mock-prod") && !r.shopify_product_id.startsWith("prod_") ? "SHOPIFY" : "ZAPAI",
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
    logger.error({ err }, "Products list error");
    return res.status(500).json({ error: "Failed to list products" });
  }
});

async function handleBulkCreate(req: Request, res: Response) {
  try {
    const rawProducts = Array.isArray(req.body) ? req.body : req.body?.products;
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return res.status(400).json({ error: "An array of products is required" });
    }

    let storeId = req.body.storeId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!storeId || !uuidRegex.test(storeId)) {
      storeId = await getStoreIdFromReq(req);
    }

    if (!storeId) {
      const { rows: newStore } = await db.query(
        "INSERT INTO stores (name, razorpay_account_id, is_active) VALUES ('My Store', 'rzp_test_mock', true) RETURNING id"
      );
      storeId = newStore[0].id;
    }

    const createdList = [];

    for (let i = 0; i < rawProducts.length; i++) {
      const item = rawProducts[i];
      if (!item.title || item.price === undefined) continue;

      const listedPrice = Number(item.price);
      const floorPrice = item.minPrice !== undefined ? Number(item.minPrice) : Math.round(listedPrice * 0.88);
      const stock = item.inventory !== undefined ? Number(item.inventory) : 10;
      const finalSku = item.sku || `SKU-${Date.now().toString().slice(-4)}${i}`;
      const variantId = `var_${Date.now()}_${i}`;
      const shopifyProdId = `prod_${Date.now()}_${i}`;
      const itemImageUrl = item.imageUrl || item.image_url || null;

      const agentSchema = {
        variantId,
        title: item.title,
        sku: finalSku,
        listedPrice,
        floorPrice,
        inventoryAvailable: stock,
        attributes: {
          category: item.category || "General",
          description: item.description || "",
        },
      };

      const { rows } = await db.query(
        `INSERT INTO products (
          store_id, shopify_product_id, shopify_variant_id,
          title, sku, listed_price, floor_price,
          inventory_available, inventory_reserved, inventory_state,
          is_ai_enabled, category, description, image_url, agent_schema,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'AVAILABLE', $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *`,
        [
          storeId,
          shopifyProdId,
          variantId,
          item.title,
          finalSku,
          listedPrice,
          floorPrice,
          stock,
          item.aiSellingEnabled ?? true,
          item.category || "General",
          item.description || "",
          itemImageUrl,
          JSON.stringify(agentSchema),
        ]
      );

      if (rows[0]) {
        const r = rows[0];
        createdList.push({
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
          imageUrl: r.image_url || null,
        });
      }
    }

    return res.status(201).json({
      success: true,
      count: createdList.length,
      products: createdList,
    });
  } catch (err: any) {
    logger.error({ err }, "Bulk create products error");
    return res.status(500).json({ error: err?.message || "Failed to bulk create products" });
  }
}

// POST /api/v1/products/bulk
router.post("/bulk", handleBulkCreate);

// POST /api/v1/products
router.post("/", async (req: Request, res: Response) => {
  try {
    if (Array.isArray(req.body) || (req.body?.products && Array.isArray(req.body.products))) {
      return handleBulkCreate(req, res);
    }

    const {
      title,
      sku,
      price,
      minPrice,
      inventory,
      category,
      description,
      imageUrl,
      aiSellingEnabled = true,
    } = req.body;

    if (!title || price === undefined) {
      return res.status(400).json({ error: "Title and price are required" });
    }

    let storeId = req.body.storeId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!storeId || !uuidRegex.test(storeId)) {
      storeId = await getStoreIdFromReq(req);
    }

    if (!storeId) {
      const { rows: newStore } = await db.query(
        "INSERT INTO stores (name, razorpay_account_id, is_active) VALUES ('My Store', 'rzp_test_mock', true) RETURNING id"
      );
      storeId = newStore[0].id;
    }

    const listedPrice = Number(price);
    const floorPrice = minPrice !== undefined ? Number(minPrice) : Math.round(listedPrice * 0.88);
    const stock = inventory !== undefined ? Number(inventory) : 10;
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
        is_ai_enabled, category, description, image_url, agent_schema,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'AVAILABLE', $9, $10, $11, $12, $13, NOW(), NOW())
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
        imageUrl || null,
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
      imageUrl: r.image_url,
      createdAt: new Date(r.created_at).toISOString(),
    };

    return res.status(201).json(createdProduct);
  } catch (err: any) {
    logger.error({ err }, "Create product error");
    return res.status(500).json({ error: err?.message || "Failed to create product" });
  }
});

// GET /api/v1/products/:id
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT p.*, s.name as store_name
       FROM products p
       LEFT JOIN stores s ON p.store_id = s.id
       WHERE p.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const r = rows[0];
    const listedPrice = parseFloat(r.listed_price);
    const floorPrice = parseFloat(r.floor_price);

    return res.json({
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
      provider: r.shopify_product_id && !r.shopify_product_id.startsWith("mock-prod") && !r.shopify_product_id.startsWith("prod_") ? "SHOPIFY" : "ZAPAI",
      aiSellingEnabled: r.is_ai_enabled ?? true,
      maxDiscountPercent: listedPrice > 0 ? Math.round(((listedPrice - floorPrice) / listedPrice) * 100) : 12,
      description: r.description || "",
      category: r.category || "General",
      imageUrl: r.image_url,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error({ err }, "Get product error");
    return res.status(500).json({ error: err?.message || "Failed to fetch product" });
  }
});

// PATCH /api/v1/products/:id/toggle-ai
router.patch("/:id/toggle-ai", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const targetState =
      req.body.isAiEnabled ??
      req.body.enabled ??
      req.body.aiSellingEnabled ??
      req.body.is_ai_enabled;

    let query: string;
    let params: any[];

    if (targetState !== undefined) {
      query = `UPDATE products
               SET is_ai_enabled = $1, updated_at = NOW()
               WHERE id = $2
               RETURNING id, is_ai_enabled, title, listed_price, floor_price, sku, inventory_available`;
      params = [Boolean(targetState), id];
    } else {
      query = `UPDATE products
               SET is_ai_enabled = NOT COALESCE(is_ai_enabled, true), updated_at = NOW()
               WHERE id = $1
               RETURNING id, is_ai_enabled, title, listed_price, floor_price, sku, inventory_available`;
      params = [id];
    }

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const r = rows[0];
    const listedPrice = parseFloat(r.listed_price);
    const floorPrice = parseFloat(r.floor_price);

    return res.json({
      success: true,
      id: r.id,
      isAiEnabled: r.is_ai_enabled,
      aiSellingEnabled: r.is_ai_enabled,
      title: r.title,
      sku: r.sku,
      price: listedPrice,
      minPrice: floorPrice,
      inventory: parseInt(r.inventory_available, 10),
    });
  } catch (err: any) {
    logger.error({ err }, "Toggle AI error");
    return res.status(500).json({ error: err?.message || "Failed to toggle AI status" });
  }
});

// PATCH /api/v1/products/:id
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      price,
      minPrice,
      inventory,
      category,
      description,
      imageUrl,
      isAiEnabled,
      aiSellingEnabled,
    } = req.body;

    const { rows: existingRows } = await db.query(
      "SELECT * FROM products WHERE id = $1 LIMIT 1",
      [id]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const prev = existingRows[0];
    const newTitle = title !== undefined ? title : prev.title;
    const newPrice = price !== undefined ? Number(price) : parseFloat(prev.listed_price);
    const newFloor = minPrice !== undefined ? Number(minPrice) : (price !== undefined ? Math.round(newPrice * 0.88) : parseFloat(prev.floor_price));
    const newStock = inventory !== undefined ? Number(inventory) : parseInt(prev.inventory_available, 10);
    const newCategory = category !== undefined ? category : (prev.category || "General");
    const newDesc = description !== undefined ? description : (prev.description || "");
    const newImage = imageUrl !== undefined ? imageUrl : prev.image_url;
    const newAi = (isAiEnabled ?? aiSellingEnabled) !== undefined ? Boolean(isAiEnabled ?? aiSellingEnabled) : prev.is_ai_enabled;

    const agentSchema = {
      variantId: prev.shopify_variant_id || `var_${prev.id}`,
      title: newTitle,
      sku: prev.sku,
      listedPrice: newPrice,
      floorPrice: newFloor,
      inventoryAvailable: newStock,
      attributes: {
        category: newCategory,
        description: newDesc,
      },
    };

    const { rows } = await db.query(
      `UPDATE products
       SET
         title = $1,
         listed_price = $2,
         floor_price = $3,
         inventory_available = $4,
         category = $5,
         description = $6,
         image_url = $7,
         is_ai_enabled = $8,
         agent_schema = $9,
         updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        newTitle,
        newPrice,
        newFloor,
        newStock,
        newCategory,
        newDesc,
        newImage,
        newAi,
        JSON.stringify(agentSchema),
        id,
      ]
    );

    const r = rows[0];
    return res.json({
      id: r.id,
      storeId: r.store_id,
      title: r.title,
      sku: r.sku,
      price: parseFloat(r.listed_price),
      minPrice: parseFloat(r.floor_price),
      inventory: parseInt(r.inventory_available, 10),
      provider: r.shopify_product_id && !r.shopify_product_id.startsWith("mock-prod") && !r.shopify_product_id.startsWith("prod_") ? "SHOPIFY" : "ZAPAI",
      aiSellingEnabled: r.is_ai_enabled,
      isAiEnabled: r.is_ai_enabled,
      maxDiscountPercent: Math.round(((newPrice - newFloor) / newPrice) * 100),
      description: r.description,
      category: r.category,
      imageUrl: r.image_url,
      updatedAt: new Date(r.updated_at).toISOString(),
    });
  } catch (err: any) {
    logger.error({ err }, "Update product error");
    return res.status(500).json({ error: err?.message || "Failed to update product" });
  }
});

// DELETE /api/v1/products/:id
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      "DELETE FROM products WHERE id = $1 RETURNING id, title",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({
      success: true,
      message: `Product "${rows[0].title}" deleted successfully`,
      id: rows[0].id,
    });
  } catch (err: any) {
    logger.error({ err }, "Delete product error");
    return res.status(500).json({ error: err?.message || "Failed to delete product" });
  }
});

export default router;

import { Router } from "express";
import { db } from "../db/migrate.ts";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

const router = Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.X402_SIGNING_SECRET ||
  "zapai_jwt_secret_neon_auth_2026";

async function getUserAndStore(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (decoded?.userId) {
        const { rows } = await db.query(
          `SELECT u.id, u.name, u.email, u.phone, u.role, u.store_id, s.name as store_name, s.is_active
           FROM users u
           LEFT JOIN stores s ON u.store_id = s.id
           WHERE u.id = $1 LIMIT 1`,
          [decoded.userId]
        );
        if (rows[0]) return rows[0];
      }
    } catch {
      // ignore
    }
  }

  // Check storeId from query/header
  const storeId = (req.query.storeId as string) || (req.headers["x-store-id"] as string);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (storeId && uuidRegex.test(storeId)) {
    const { rows } = await db.query(
      `SELECT s.id as store_id, s.name as store_name, s.email, s.phone, s.role, s.is_active
       FROM stores s WHERE s.id = $1 LIMIT 1`,
      [storeId]
    );
    if (rows[0]) return rows[0];
  }

  // Fallback to active store
  const { rows } = await db.query(
    `SELECT s.id as store_id, s.name as store_name, s.email, s.phone, s.role, s.is_active
     FROM stores s WHERE s.is_active = true ORDER BY s.created_at DESC LIMIT 1`
  );
  return rows[0] || null;
}

// GET /api/v1/merchant/profile — Fetch real merchant profile
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const info = await getUserAndStore(req);

    if (!info) {
      return res.json({
        name: "",
        email: "",
        phone: "",
        merchantId: "",
        storeName: "Merchant Store",
        role: "Store Owner & Admin",
        status: "active",
      });
    }

    return res.json({
      name: info.name || "",
      email: info.email || "",
      phone: info.phone || "",
      merchantId: info.store_id ? `merch_${info.store_id.slice(0, 8)}` : "",
      storeName: info.store_name || "Merchant Store",
      role: info.role || "Store Owner & Admin",
      status: info.is_active ? "active" : "inactive",
    });
  } catch (err) {
    console.error("Get merchant profile error:", err);
    return res.status(500).json({ error: "Failed to fetch merchant profile" });
  }
});

// PUT /api/v1/merchant/profile — Update merchant profile
router.put("/profile", async (req: Request, res: Response) => {
  try {
    const info = await getUserAndStore(req);
    const { storeName, phone, name } = req.body;

    if (info?.store_id) {
      await db.query(
        `UPDATE stores
         SET
           name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           updated_at = NOW()
         WHERE id = $3`,
        [storeName, phone, info.store_id]
      );
    }

    if (info?.id) {
      await db.query(
        `UPDATE users
         SET
           name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           updated_at = NOW()
         WHERE id = $3`,
        [name, phone, info.id]
      );
    }

    return res.json({
      name: name || info?.name || "Merchant Owner",
      email: info?.email || "merchant@zapai.in",
      phone: phone || info?.phone || "+91 98765 00000",
      merchantId: info?.store_id ? `merch_${info.store_id.slice(0, 8)}` : "merch_zapai",
      storeName: storeName || info?.store_name || "My Store",
      role: info?.role || "Store Owner & Admin",
      status: "active",
    });
  } catch (err) {
    console.error("Save merchant profile error:", err);
    return res.status(500).json({ error: "Failed to save merchant profile" });
  }
});

export default router;

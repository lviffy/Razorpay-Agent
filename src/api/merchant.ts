import { Router } from "express";
import { db } from "../db/migrate.ts";
import type { Request, Response } from "express";

const router = Router();

// GET /api/v1/merchant/profile — Fetch merchant profile
router.get("/profile", async (req: Request, res: Response) => {
  try {
    const storeId = (req.query.storeId as string) || "a0000000-0000-0000-0000-000000000001";
    const { rows } = await db.query(
      `SELECT * FROM stores WHERE id = $1 LIMIT 1`,
      [storeId]
    );

    if (!rows[0]) {
      return res.json({
        name: "Rahul Mehta",
        email: "merchant@runfastsports.in",
        phone: "+91 98765 00000",
        merchantId: "merch_runfast",
        storeName: "RunFast Sports",
        role: "Store Owner & Admin",
        status: "active",
      });
    }

    const r = rows[0];
    return res.json({
      name: "Rahul Mehta",
      email: r.email || "merchant@runfastsports.in",
      phone: r.phone || "+91 98765 00000",
      merchantId: "merch_runfast",
      storeName: r.name || "RunFast Sports",
      role: r.role || "Store Owner & Admin",
      status: r.is_active ? "active" : "inactive",
    });
  } catch (err) {
    console.error("Get merchant profile error:", err);
    return res.status(500).json({ error: "Failed to fetch merchant profile" });
  }
});

// PUT /api/v1/merchant/profile — Update merchant profile
router.put("/profile", async (req: Request, res: Response) => {
  try {
    const storeId = (req.body.storeId as string) || "a0000000-0000-0000-0000-000000000001";
    const { storeName, phone, name } = req.body;

    const { rows } = await db.query(
      `UPDATE stores
       SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [storeName, phone, storeId]
    );

    const r = rows[0] || {};
    return res.json({
      name: name || "Rahul Mehta",
      email: r.email || "merchant@runfastsports.in",
      phone: r.phone || phone || "+91 98765 00000",
      merchantId: "merch_runfast",
      storeName: r.name || storeName || "RunFast Sports",
      role: r.role || "Store Owner & Admin",
      status: "active",
    });
  } catch (err) {
    console.error("Save merchant profile error:", err);
    return res.status(500).json({ error: "Failed to save merchant profile" });
  }
});

export default router;

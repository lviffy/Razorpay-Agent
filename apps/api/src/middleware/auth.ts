import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "@zapai/database";
import { env } from "../config/env.ts";

const JWT_SECRET = env.JWT_SECRET || "zapai_jwt_secret_neon_auth_2026";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  storeId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Check user in Neon DB
    const userRes = await db.query(
      "SELECT id, email, name, role, store_id, is_active FROM users WHERE id = $1 LIMIT 1",
      [decoded.userId]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      return res.status(401).json({ error: "User not found or inactive" });
    }

    const row = userRes.rows[0];
    req.user = {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      storeId: row.store_id,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication check failed" });
  }
}

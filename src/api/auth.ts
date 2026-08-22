import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db/migrate.ts";
import type { Request, Response } from "express";

const router = Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.X402_SIGNING_SECRET ||
  "zapai_jwt_secret_neon_auth_2026";

const DEFAULT_STORE_ID = "a0000000-0000-0000-0000-000000000001";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || `${APP_URL}/api/v1/auth/google/callback`;

const googleOAuthClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
);

// ── Helpers ──────────────────────────────────────────────────────────────────
function generateToken(
  user: { id: string; email: string; name: string; role: string; storeId?: string; onboardingCompleted?: boolean },
  expiresIn = "7d"
) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      onboardingCompleted: Boolean(user.onboardingCompleted),
    },
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  );
}

// ── POST /api/v1/auth/signup ──────────────────────────────────────────────────
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, storeName, phone } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Full name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    // Check if user already exists in Neon DB
    const existing = await db.query(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    // Hash password using bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let storeId: string | null = null;
    let actualStoreName = storeName || "My Merchant Store";

    // If storeName was provided, create a dedicated store record in Neon DB
    if (storeName && storeName.trim()) {
      try {
        const storeRes = await db.query(
          `INSERT INTO stores (name, email, phone, role)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name`,
          [storeName.trim(), normalizedEmail, phone || "+91 98765 00000", "Store Owner & Admin"]
        );
        if (storeRes.rows[0]) {
          storeId = storeRes.rows[0].id;
          actualStoreName = storeRes.rows[0].name;

          // Insert initial default negotiation rules for the new store
          await db.query(
            `INSERT INTO negotiation_rules (store_id, max_discount_percentage, min_order_value_for_discount, free_shipping_threshold, allow_bundle_offers, risk_profile, human_approval_above)
             VALUES ($1, 12.00, 1000.00, 2500.00, true, 'balanced', 5000.00)
             ON CONFLICT DO NOTHING`,
            [storeId]
          );
        }
      } catch (storeErr) {
        console.warn("Could not create dedicated store:", storeErr);
      }
    }

    // Insert user into Neon DB
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, name, role, store_id, phone, provider, is_active, onboarding_completed)
       VALUES ($1, $2, $3, 'merchant_owner', $4, $5, 'credentials', true, false)
       RETURNING id, email, name, role, store_id, phone, avatar_url, onboarding_completed, created_at`,
      [normalizedEmail, passwordHash, fullName.trim(), storeId, phone || null]
    );

    const newUser = userRes.rows[0];

    // Generate JWT Token
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      storeId: newUser.store_id,
      onboardingCompleted: Boolean(newUser.onboarding_completed),
    }, "7d");

    // Track active session in Neon DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const userAgent = req.headers["user-agent"] || null;
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null;

    await db.query(
      `INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [newUser.id, token, expiresAt, userAgent, ipAddress]
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone || "+91 98765 00000",
        avatarUrl: newUser.avatar_url,
        storeId: newUser.store_id,
        storeName: actualStoreName,
        merchantId: `merch_${newUser.id.slice(0, 8)}`,
        onboardingCompleted: Boolean(newUser.onboarding_completed),
        isNewUser: true,
      },
      message: "Merchant account created successfully.",
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return res.status(500).json({
      error: err?.message || "Failed to create merchant account. Please try again.",
    });
  }
});

// ── POST /api/v1/auth/login ───────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter both email and password." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user and joined store from Neon DB
    const userRes = await db.query(
      `SELECT 
         u.id, 
         u.email, 
         u.password_hash, 
         u.name, 
         u.role, 
         u.store_id, 
         u.phone, 
         u.avatar_url, 
         u.provider, 
         u.is_active,
         u.onboarding_completed,
         s.name as store_name,
         s.city as store_city
       FROM users u
       LEFT JOIN stores s ON u.store_id = s.id
       WHERE LOWER(u.email) = $1
       LIMIT 1`,
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: "This merchant account is inactive. Please contact support." });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        error: `This account was registered via ${user.provider || "Google"}. Please sign in using Google.`,
      });
    }

    // Verify password hash with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const durationDays = rememberMe ? 30 : 1;
    const expiresIn = `${durationDays}d`;
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.store_id,
      onboardingCompleted: Boolean(user.onboarding_completed),
    }, expiresIn);

    // Save session in Neon DB
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const userAgent = req.headers["user-agent"] || null;
    const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || null;

    await db.query(
      `INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, token, expiresAt, userAgent, ipAddress]
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || "+91 98765 00000",
        avatarUrl: user.avatar_url,
        storeId: user.store_id,
        storeName: user.store_name || "ZapAI Store",
        storeCity: user.store_city || "Bengaluru",
        merchantId: `merch_${user.id.slice(0, 8)}`,
        onboardingCompleted: Boolean(user.onboarding_completed),
        isNewUser: false,
      },
      message: "Signed in successfully.",
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(500).json({
      error: err?.message || "Authentication failed. Please try again.",
    });
  }
});

// ── GET /api/v1/auth/google/url ───────────────────────────────────────────────
router.get("/google/url", (req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.json({
      configured: false,
      url: null,
      message: "GOOGLE_CLIENT_ID not configured.",
    });
  }

  const origin =
    (req.query.origin as string) ||
    (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
    APP_URL;

  const url = googleOAuthClient.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent",
    state: origin,
  });

  return res.json({ configured: true, url });
});

// ── GET /api/v1/auth/google/callback ──────────────────────────────────────────
router.get("/google/callback", async (req: Request, res: Response) => {
  const state = req.query.state as string;
  let targetBase = APP_URL;
  if (state && (state.startsWith("http://") || state.startsWith("https://"))) {
    targetBase = state.replace(/\/+$/, "");
  }

  try {
    const code = req.query.code as string;
    if (!code) {
      return res.redirect(`${targetBase}/login?error=Google+authorization+code+missing`);
    }

    const { tokens } = await googleOAuthClient.getToken(code);
    googleOAuthClient.setCredentials(tokens);

    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    if (tokens.id_token && GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleOAuthClient.verifyIdToken({
          idToken: tokens.id_token,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload?.email;
        name = payload?.name;
        picture = payload?.picture;
      } catch (idErr) {
        console.warn("verifyIdToken fallback to userinfo:", idErr);
      }
    }

    if (!email && tokens.access_token) {
      const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const info = await infoRes.json();
      email = info.email;
      name = info.name;
      picture = info.picture;
    }

    if (!email) {
      return res.redirect(`${targetBase}/login?error=Failed+to+retrieve+email+from+Google`);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let userRes = await db.query(
      `SELECT u.*, s.name as store_name, s.city as store_city 
       FROM users u 
       LEFT JOIN stores s ON u.store_id = s.id 
       WHERE LOWER(u.email) = $1 LIMIT 1`,
      [normalizedEmail]
    );

    let user = userRes.rows[0];
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const insertRes = await db.query(
        `INSERT INTO users (email, name, role, store_id, avatar_url, provider, is_active, onboarding_completed)
         VALUES ($1, $2, 'merchant_owner', NULL, $3, 'google', true, false)
         RETURNING *`,
        [normalizedEmail, name || "Google Merchant", picture || null]
      );
      user = insertRes.rows[0];
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.store_id,
      onboardingCompleted: Boolean(user.onboarding_completed),
    }, "7d");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO sessions (user_id, token, expires_at, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [user.id, token, expiresAt, req.headers["user-agent"] || null]
    );

    const onboardingDone = Boolean(user.onboarding_completed);
    return res.redirect(`${targetBase}/auth/callback?token=${token}&email=${encodeURIComponent(user.email)}&onboardingCompleted=${onboardingDone}&isNewUser=${isNewUser}`);
  } catch (err: any) {
    console.error("Google callback error:", err);
    const errMessage = encodeURIComponent(err?.message || "Google authentication failed");
    return res.redirect(`${targetBase}/login?error=${errMessage}`);
  }
});

// ── POST /api/v1/auth/google ──────────────────────────────────────────────────
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential, code, email, fullName, avatarUrl } = req.body;

    let googleEmail = email;
    let googleName = fullName;
    let googleAvatar = avatarUrl;

    // 1. If Google ID token credential was provided, verify it
    if (credential && GOOGLE_CLIENT_ID) {
      try {
        const ticket = await googleOAuthClient.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (payload?.email) {
          googleEmail = payload.email;
          googleName = payload.name || googleName;
          googleAvatar = payload.picture || googleAvatar;
        }
      } catch (verifyErr) {
        console.warn("Google verifyIdToken error:", verifyErr);
      }
    }

    // 2. If OAuth authorization code was provided, exchange it
    if (code && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      try {
        const { tokens } = await googleOAuthClient.getToken(code);
        if (tokens.access_token) {
          const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          const info = await infoRes.json();
          if (info.email) {
            googleEmail = info.email;
            googleName = info.name || googleName;
            googleAvatar = info.picture || googleAvatar;
          }
        }
      } catch (codeErr) {
        console.warn("Google code exchange error:", codeErr);
      }
    }

    // Fallback email if simulated / test mode
    const ssoEmail = (googleEmail || "google.merchant@zapai.io").toLowerCase().trim();
    const ssoName = googleName || "Google Merchant";

    // Check if user already exists
    let userRes = await db.query(
      `SELECT u.*, s.name as store_name, s.city as store_city 
       FROM users u 
       LEFT JOIN stores s ON u.store_id = s.id 
       WHERE LOWER(u.email) = $1 LIMIT 1`,
      [ssoEmail]
    );

    let user = userRes.rows[0];
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const insertRes = await db.query(
        `INSERT INTO users (email, name, role, store_id, avatar_url, provider, is_active, onboarding_completed)
         VALUES ($1, $2, 'merchant_owner', NULL, $3, 'google', true, false)
         RETURNING *`,
        [ssoEmail, ssoName, googleAvatar || null]
      );
      user = insertRes.rows[0];
    } else if (googleAvatar && !user.avatar_url) {
      await db.query("UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2", [
        googleAvatar,
        user.id,
      ]);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      storeId: user.store_id,
      onboardingCompleted: Boolean(user.onboarding_completed),
    }, "7d");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query(
      `INSERT INTO sessions (user_id, token, expires_at, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [user.id, token, expiresAt, req.headers["user-agent"] || null]
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || "+91 98765 00000",
        avatarUrl: user.avatar_url || googleAvatar,
        storeId: user.store_id,
        storeName: user.store_name || "ZapAI Store",
        merchantId: `merch_${user.id.slice(0, 8)}`,
        onboardingCompleted: Boolean(user.onboarding_completed),
        isNewUser,
      },
      message: "Signed in with Google successfully.",
    });
  } catch (err: any) {
    console.error("Google SSO error:", err);
    return res.status(500).json({
      error: err?.message || "Google authentication failed.",
    });
  }
});

// ── GET /api/v1/auth/me ───────────────────────────────────────────────────────
router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header." });
    }

    const token = authHeader.split(" ")[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ error: "Session token is expired or invalid." });
    }

    const userRes = await db.query(
      `SELECT 
         u.id, 
         u.email, 
         u.name, 
         u.role, 
         u.store_id, 
         u.phone, 
         u.avatar_url, 
         u.provider, 
         u.is_active,
         u.onboarding_completed,
         s.name as store_name,
         s.city as store_city,
         s.phone as store_phone
       FROM users u
       LEFT JOIN stores s ON u.store_id = s.id
       WHERE u.id = $1
       LIMIT 1`,
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = userRes.rows[0];

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || user.store_phone || "+91 98765 00000",
        avatarUrl: user.avatar_url,
        storeId: user.store_id || DEFAULT_STORE_ID,
        storeName: user.store_name || "ZapAI Store",
        storeCity: user.store_city || "Bengaluru",
        merchantId: `merch_${user.id.slice(0, 8)}`,
        onboardingCompleted: Boolean(user.onboarding_completed),
      },
    });
  } catch (err: any) {
    console.error("Fetch current user error:", err);
    return res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

// ── POST /api/v1/auth/logout ──────────────────────────────────────────────────
router.post("/logout", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      await db.query("DELETE FROM sessions WHERE token = $1", [token]);
    }
    return res.json({ success: true, message: "Logged out successfully." });
  } catch (err: any) {
    console.error("Logout error:", err);
    return res.status(500).json({ error: "Logout failed." });
  }
});

export default router;

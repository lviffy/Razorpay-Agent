import { db } from "@zapai/database";
import { getShopifyClient, SHOPIFY_API_VERSION } from "./client.ts";
import { logger } from "../../core/logger/index.ts";

export interface ShopifyShopInfo {
  id: number;
  name: string;
  email: string;
  domain: string;
  myshopify_domain: string;
  currency: string;
  country_name?: string;
  plan_name?: string;
}

export interface ShopifyConnectionRecord {
  id: string;
  storeId: string;
  shopDomain: string;
  shopName: string;
  myshopifyDomain: string;
  accessToken: string;
  webhookSecret?: string;
  apiVersion: string;
  currency: string;
  status: string;
  lastSyncedAt?: string;
  productsSyncedCount: number;
}

export function normalizeShopDomain(raw: string): string {
  if (!raw) return "";
  let clean = raw.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, "");
  clean = clean.replace(/\/.*$/, "");
  if (!clean.includes(".")) {
    clean = `${clean}.myshopify.com`;
  }
  return clean;
}

export async function verifyShopifyCredentials(
  shopDomain: string,
  accessToken: string
): Promise<{ valid: boolean; shop?: ShopifyShopInfo; error?: string }> {
  const domain = normalizeShopDomain(shopDomain);
  const token = accessToken.trim();

  if (!domain) {
    return { valid: false, error: "Shopify store domain is required." };
  }

  if (!token) {
    return { valid: false, error: "Shopify Admin API Access Token is required (starts with 'shpat_')" };
  }

  const candidates: string[] = [domain];
  if (!domain.includes(".myshopify.com")) {
    const handle = domain.replace(/\.[a-z0-9.-]+$/i, "");
    if (handle && handle !== domain) {
      candidates.push(`${handle}.myshopify.com`);
    }
  }

  let lastError = "";

  for (const candidate of candidates) {
    try {
      const client = getShopifyClient(candidate, token);
      const res = await client.get("/shop.json");

      if (res.status === 200 && res.data?.shop) {
        return { valid: true, shop: res.data.shop };
      }
    } catch (err: any) {
      if (err.response) {
        if (err.response.status === 401 || err.response.status === 403) {
          return {
            valid: false,
            error: "Authentication failed: Invalid Admin API token or insufficient permissions.",
          };
        }
        if (err.response.status === 404) {
          lastError = `Shopify store '${candidate}' not found. Please verify the domain or token.`;
          continue;
        }
        lastError = `Shopify API error (${err.response.status}): ${err.response.data?.errors || err.message}`;
      } else {
        lastError = `Network error connecting to '${candidate}': ${err.message}`;
      }
    }
  }

  return {
    valid: false,
    error: lastError || `Could not connect to Shopify at '${domain}'.`,
  };
}

export async function getShopifyConnection(storeId: string): Promise<ShopifyConnectionRecord | null> {
  if (!storeId || storeId === "00000000-0000-0000-0000-000000000000") {
    return null;
  }

  try {
    const queryPromise = db.query(
      `SELECT * FROM shopify_connections WHERE store_id = $1 LIMIT 1`,
      [storeId]
    );
    const timeoutPromise = new Promise<{ rows: any[] }>((_, reject) =>
      setTimeout(() => reject(new Error("DB query timeout")), 1500)
    );

    const { rows } = await Promise.race([queryPromise, timeoutPromise]);

    if (rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id,
        storeId: r.store_id,
        shopDomain: r.shop_domain,
        shopName: r.shop_name,
        myshopifyDomain: r.myshopify_domain,
        accessToken: r.access_token,
        webhookSecret: r.webhook_secret,
        apiVersion: r.api_version || SHOPIFY_API_VERSION,
        currency: r.currency || "INR",
        status: r.status,
        lastSyncedAt: r.last_synced_at ? new Date(r.last_synced_at).toISOString() : undefined,
        productsSyncedCount: parseInt(r.products_synced_count || "0", 10),
      };
    }

    // Fallback to stores.agent_settings.credentials for backward compatibility
    const storeQueryPromise = db.query(
      `SELECT agent_settings, currency, name FROM stores WHERE id = $1 LIMIT 1`,
      [storeId]
    );
    const storeTimeoutPromise = new Promise<{ rows: any[] }>((_, reject) =>
      setTimeout(() => reject(new Error("DB query timeout")), 1500)
    );
    const { rows: storeRows } = await Promise.race([storeQueryPromise, storeTimeoutPromise]);

    const creds = storeRows[0]?.agent_settings?.credentials || {};
    const shopMeta = storeRows[0]?.agent_settings?.shopify || {};

    if (creds.shopifyAccessToken && (creds.shopifyShopDomain || shopMeta.domain)) {
      return {
        id: `legacy_${storeId}`,
        storeId,
        shopDomain: creds.shopifyShopDomain || shopMeta.domain,
        shopName: shopMeta.shopName || storeRows[0]?.name || "Shopify Store",
        myshopifyDomain: shopMeta.myshopifyDomain || creds.shopifyShopDomain || "",
        accessToken: creds.shopifyAccessToken,
        webhookSecret: creds.shopifyWebhookSecret,
        apiVersion: SHOPIFY_API_VERSION,
        currency: shopMeta.currency || storeRows[0]?.currency || "INR",
        status: "connected",
        lastSyncedAt: shopMeta.lastSyncedAt,
        productsSyncedCount: 0,
      };
    }

    return null;
  } catch (err) {
    logger.error({ err, storeId }, "Error fetching shopify connection");
    return null;
  }
}

export async function saveShopifyConnection(
  storeId: string,
  params: {
    shopDomain: string;
    shopName: string;
    myshopifyDomain: string;
    accessToken: string;
    webhookSecret?: string;
    currency?: string;
  }
): Promise<void> {
  const domain = normalizeShopDomain(params.shopDomain);
  const myshopify = normalizeShopDomain(params.myshopifyDomain || params.shopDomain);

  await db.query(
    `INSERT INTO shopify_connections (
      store_id, shop_domain, shop_name, myshopify_domain,
      access_token, webhook_secret, api_version, currency,
      status, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'connected', NOW())
    ON CONFLICT (store_id) DO UPDATE SET
      shop_domain = EXCLUDED.shop_domain,
      shop_name = EXCLUDED.shop_name,
      myshopify_domain = EXCLUDED.myshopify_domain,
      access_token = EXCLUDED.access_token,
      webhook_secret = COALESCE(EXCLUDED.webhook_secret, shopify_connections.webhook_secret),
      api_version = EXCLUDED.api_version,
      currency = EXCLUDED.currency,
      status = 'connected',
      updated_at = NOW()`,
    [
      storeId,
      domain,
      params.shopName,
      myshopify,
      params.accessToken,
      params.webhookSecret || null,
      SHOPIFY_API_VERSION,
      params.currency || "INR",
    ]
  );

  // Sync to stores table agent_settings for backward compatibility
  const { rows: storeRows } = await db.query(
    `SELECT agent_settings, name FROM stores WHERE id = $1 LIMIT 1`,
    [storeId]
  );
  const prevSettings = storeRows[0]?.agent_settings || {};
  const prevCreds = prevSettings.credentials || {};

  const updatedSettings = {
    ...prevSettings,
    credentials: {
      ...prevCreds,
      shopifyShopDomain: domain,
      shopifyAccessToken: params.accessToken,
      hasShopifyAccessToken: true,
      shopifyWebhookSecret: params.webhookSecret || prevCreds.shopifyWebhookSecret || "",
    },
    shopify: {
      domain,
      shopName: params.shopName,
      myshopifyDomain: myshopify,
      currency: params.currency || "INR",
      lastSyncedAt: new Date().toISOString(),
    },
  };

  await db.query(
    `UPDATE stores
     SET
       agent_settings = $1,
       name = CASE WHEN name = 'ZapAI Store' OR name = 'Merchant Store' THEN $2 ELSE name END,
       currency = COALESCE($3, currency),
       updated_at = NOW()
     WHERE id = $4`,
    [
      JSON.stringify(updatedSettings),
      params.shopName || "Shopify Store",
      params.currency || "INR",
      storeId,
    ]
  );
}

export async function disconnectShopifyConnection(storeId: string): Promise<void> {
  await db.query(
    `UPDATE shopify_connections SET status = 'disconnected', updated_at = NOW() WHERE store_id = $1`,
    [storeId]
  );

  const { rows } = await db.query(
    `SELECT agent_settings FROM stores WHERE id = $1 LIMIT 1`,
    [storeId]
  );
  if (rows[0]) {
    const s = rows[0].agent_settings || {};
    if (s.credentials) {
      delete s.credentials.shopifyAccessToken;
      s.credentials.hasShopifyAccessToken = false;
    }
    await db.query(
      `UPDATE stores SET agent_settings = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(s), storeId]
    );
  }
}

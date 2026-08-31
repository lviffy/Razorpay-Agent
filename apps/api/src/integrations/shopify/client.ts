import axios, { AxiosInstance } from "axios";
import { env } from "../../config/env.ts";

export const SHOPIFY_API_VERSION = env.SHOPIFY_API_VERSION || "2024-07";

export function getShopifyClient(shopDomain: string, accessToken: string): AxiosInstance {
  const cleanDomain = shopDomain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const token = accessToken.trim();

  return axios.create({
    baseURL: `https://${cleanDomain}/admin/api/${SHOPIFY_API_VERSION}`,
    headers: {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    timeout: 12000,
  });
}

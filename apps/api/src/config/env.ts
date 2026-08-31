import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8000),
  APP_URL: z.string().default("http://localhost:8000"),
  DATABASE_URL: z.string().default(""),
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // AI
  GEMINI_API_KEY: z.string().default(""),
  GROQ_API_KEY: z.string().default(""),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),

  // WhatsApp
  WHATSAPP_PHONE_NUMBER_ID: z.string().default(""),
  WHATSAPP_ACCESS_TOKEN: z.string().default(""),
  WHATSAPP_APP_SECRET: z.string().default(""),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default("zapai_verify_token"),

  // Google OAuth & Auth
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CALLBACK_URL: z.string().default("http://localhost:3000/api/v1/auth/google/callback"),
  JWT_SECRET: z.string().default("zapai_super_secret_jwt_signing_key_2026"),

  // x402
  X402_SIGNING_SECRET: z.string().default("zapai_x402_signing_secret_key_2026"),

  // Shopify
  SHOPIFY_API_KEY: z.string().default(""),
  SHOPIFY_API_SECRET: z.string().default(""),
  SHOPIFY_API_VERSION: z.string().default("2024-07"),
  SHOPIFY_WEBHOOK_SECRET: z.string().default(""),
  SHOPIFY_SCOPES: z.string().default("read_products,read_inventory,write_orders"),
  SHOPIFY_REDIRECT_URI: z.string().default(""),

  // Cloudinary (Optional)
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().default(""),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().default(""),

  SKIP_SEED: z.string().default("false"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.ts";
import { logger } from "../../core/logger/index.ts";

let groqInstance: Groq | null = null;
let geminiInstance: GoogleGenerativeAI | null = null;

export function getGroqClient(): Groq | null {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  if (!groqInstance) {
    try {
      groqInstance = new Groq({ apiKey, maxRetries: 0, timeout: 6000 });
    } catch (err) {
      logger.warn({ err }, "⚠️ Failed to initialize Groq client");
      return null;
    }
  }
  return groqInstance;
}

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  if (!geminiInstance) {
    try {
      geminiInstance = new GoogleGenerativeAI(apiKey);
    } catch (err) {
      logger.warn({ err }, "⚠️ Failed to initialize Gemini client");
      return null;
    }
  }
  return geminiInstance;
}

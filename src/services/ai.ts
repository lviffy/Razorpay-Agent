import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

let groqInstance: Groq | null = null;
let geminiInstance: GoogleGenerativeAI | null = null;

export function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  if (!groqInstance) {
    try {
      groqInstance = new Groq({ apiKey });
    } catch (err) {
      console.warn("⚠️ Failed to initialize Groq client:", err);
      return null;
    }
  }
  return groqInstance;
}

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  if (!geminiInstance) {
    try {
      geminiInstance = new GoogleGenerativeAI(apiKey);
    } catch (err) {
      console.warn("⚠️ Failed to initialize Gemini client:", err);
      return null;
    }
  }
  return geminiInstance;
}

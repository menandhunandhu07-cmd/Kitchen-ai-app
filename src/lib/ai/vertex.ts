import { GoogleGenAI } from "@google/genai";
import { initCredentials } from "../firebase/credentials";

// Initialize environment variables and write the temporary credentials file if necessary
initCredentials();

// Initialize the new Google Gen AI SDK for Vertex AI
const ai = new GoogleGenAI({
  vertexai: true,
  project:
    process.env.VERTEX_AI_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "kitchen-ai-app-ce56c",
  location: process.env.VERTEX_AI_LOCATION || "us-central1",
});

export { ai };
export const GEMINI_MODEL = "gemini-2.5-flash";

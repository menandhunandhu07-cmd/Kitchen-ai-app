import { GoogleGenAI } from "@google/genai";
import path from "path";

// Ensure the Google Application Credentials env var is an absolute path
// so the underlying Google Auth libraries can find it reliably.
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
  !path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
    process.cwd(),
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

// Initialize the new Google Gen AI SDK for Vertex AI
const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.VERTEX_AI_PROJECT_ID || "kitchen-ai-app-ce56c",
  location: process.env.VERTEX_AI_LOCATION || "us-central1",
});

export { ai };
export const GEMINI_MODEL = "gemini-2.5-flash";

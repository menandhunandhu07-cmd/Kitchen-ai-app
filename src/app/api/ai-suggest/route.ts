import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ai, GEMINI_MODEL } from "@/lib/ai/vertex";

const MOCK_PANTRY = [
  { id: "1", name: "Eggs", quantity: "12 pcs", freshness: "fresh", icon: "🥚" },
  { id: "2", name: "Spinach", quantity: "200g", freshness: "expiring", icon: "🥬" },
  { id: "3", name: "Chicken Breast", quantity: "500g", freshness: "fresh", icon: "🍗" },
  { id: "4", name: "Milk", quantity: "1L", freshness: "expired", icon: "🥛" },
  { id: "5", name: "Tomatoes", quantity: "4 pcs", freshness: "expiring", icon: "🍅" },
  { id: "6", name: "Onions", quantity: "1 kg", freshness: "fresh", icon: "🧅" },
  { id: "7", name: "Pasta", quantity: "500g", freshness: "fresh", icon: "🍝" },
  { id: "8", name: "Cheese", quantity: "200g", freshness: "fresh", icon: "🧀" },
];

const FALLBACK_SUGGESTIONS = [
  { id: "1", text: "Swap Milk for Almond Milk since your milk is expired.", action: "swap" },
  { id: "2", text: "Scale recipe to 2 servings (you have enough eggs).", action: "scale" },
  { id: "3", text: "Add to Thursday Meal Plan", action: "plan" },
];

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {}

    const { query = "", recipe = null, pantry: requestPantry } = body;

    // 1. Resolve pantry items (prefer request payload, fall back to Firestore, then local mock)
    let pantryItems = requestPantry || [];
    
    if (pantryItems.length === 0) {
      try {
        const snapshot = await adminDb.collection("pantry").get();
        pantryItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
      } catch (e) {
        console.warn("Could not query Firestore pantry, using mock items.", e);
      }
    }

    if (pantryItems.length === 0) {
      pantryItems = MOCK_PANTRY;
    }

    // 2. Format pantry items for prompt
    const freshAndExpiring = pantryItems.filter((i: any) => i.freshness !== "expired");
    const expired = pantryItems.filter((i: any) => i.freshness === "expired");

    const pantryDesc = freshAndExpiring
      .map((i: any) => `${i.name} (${i.quantity})${i.freshness === "expiring" ? " [Expiring]" : ""}`)
      .join(", ");

    const expiredDesc = expired.map((i: any) => i.name).join(", ");

    // 3. Build Prompt
    const prompt = `You are a helpful AI culinary assistant.
Generate 3 distinct, highly actionable culinary suggestions based on the user's pantry and context.

USER PANTRY INGREDIENTS:
${pantryDesc || "No ingredients in pantry"}

EXPIRED PANTRY ITEMS (DO NOT USE):
${expiredDesc || "None"}

CURRENT MATCHED RECIPE (IF ANY):
${recipe ? JSON.stringify(recipe) : "None"}

USER'S CUSTOM SEARCH OR CHAT QUERY (IF ANY):
"${query}"

INSTRUCTIONS:
1. Provide exactly 3 helpful recommendations.
2. Each suggestion must have:
   - "id": a unique sequential string (e.g. "1", "2", "3")
   - "text": a short, friendly, and specific suggestion. E.g. "Swap expired Milk with water or plant-based milk in your pancake recipe", "Double the Omelette portion since you have plenty of eggs left", "Add this meal to your Friday lunch planner".
   - "action": MUST be one of "swap", "scale", "plan", or "add".
3. Return the suggestions as a JSON array of objects. Do not include any codeblock formatting, just the raw JSON.`;

    // 4. Call Vertex AI
    let suggestions = null;
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                text: { type: "STRING" },
                action: { 
                  type: "STRING", 
                  enum: ["swap", "scale", "plan", "add"] 
                },
              },
              required: ["id", "text", "action"],
            },
          },
        },
      });

      const text = response.text || "";
      suggestions = JSON.parse(text);
    } catch (aiError) {
      console.error("Vertex AI suggestion failed, using fallback suggestions.", aiError);
      suggestions = FALLBACK_SUGGESTIONS;
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    console.error("Suggestions API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

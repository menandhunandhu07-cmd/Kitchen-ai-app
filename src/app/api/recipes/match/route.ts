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

const FALLBACK_RECIPES: Record<string, any> = {
  default: {
    id: "fr1",
    title: "Protein-Packed Spinach Omelette",
    image: "https://images.unsplash.com/photo-1510693062634-9721735165b5?q=80&w=2938&auto=format&fit=crop",
    rating: 4.8,
    timeMinutes: 15,
    calories: 320,
    protein: 24,
    carbs: 4,
    tags: ["Vegetarian", "High Protein", "Quick"],
    steps: [
      { id: "s1", description: "Whisk eggs in a bowl with a pinch of salt and pepper." },
      { id: "s2", description: "Heat a non-stick pan with a little oil over medium heat." },
      { id: "s3", description: "Sauté the spinach until wilted.", timerMinutes: 2 },
      { id: "s4", description: "Pour the eggs over the spinach and cook until set.", timerMinutes: 4 },
    ],
  },
  veg: {
    id: "fr2",
    title: "Sautéed Spinach & Garlic Cheese Pasta",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop",
    rating: 4.7,
    timeMinutes: 20,
    calories: 450,
    protein: 15,
    carbs: 58,
    tags: ["Vegetarian", "Quick"],
    steps: [
      { id: "s1", description: "Boil water in a pot and cook pasta with salt until al dente.", timerMinutes: 10 },
      { id: "s2", description: "In a pan, sauté minced onions and tomatoes until soft.", timerMinutes: 3 },
      { id: "s3", description: "Add spinach and stir until wilted. Mix in boiled pasta and shredded cheese.", timerMinutes: 2 },
      { id: "s4", description: "Serve hot, garnished with extra cheese." }
    ]
  },
  chicken: {
    id: "fr3",
    title: "Tender Pan-Seared Chicken Breast",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop",
    rating: 4.9,
    timeMinutes: 25,
    calories: 380,
    protein: 36,
    carbs: 2,
    tags: ["High Protein", "Low Carb"],
    steps: [
      { id: "s1", description: "Season chicken breast with salt, pepper, and onion powder." },
      { id: "s2", description: "Heat oil in a skillet and sear chicken for 6 minutes per side.", timerMinutes: 12 },
      { id: "s3", description: "Sauté sliced onions and tomatoes in the same pan for flavor.", timerMinutes: 4 },
      { id: "s4", description: "Rest chicken for 3 minutes, slice, and serve with sautéed veggies." }
    ]
  }
};

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {}

    const { pantry: requestPantry, filters = [] } = body;

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

    // 2. Filter ingredients for Vertex AI prompt context
    const freshIngredients = pantryItems.filter((i: any) => i.freshness === "fresh");
    const expiringIngredients = pantryItems.filter((i: any) => i.freshness === "expiring");
    const expiredIngredients = pantryItems.filter((i: any) => i.freshness === "expired");

    const pantryDesc = [
      ...freshIngredients.map((i: any) => `${i.name} (${i.quantity}) [Fresh]`),
      ...expiringIngredients.map((i: any) => `${i.name} (${i.quantity}) [Expiring Soon! Use this first]`),
    ].join(", ");

    const expiredDesc = expiredIngredients.map((i: any) => i.name).join(", ");

    // 3. Build Prompt
    const prompt = `You are a professional Michelin-star culinary chef AI.
Your task is to generate one matched recipe based on the user's pantry ingredients and dietary filters.

AVAILABLE PANTRY ITEMS:
${pantryDesc || "No fresh/expiring ingredients available."}

DO NOT USE THESE EXPIRED ITEMS:
${expiredDesc || "None"}

DIETARY / TIME FILTERS ACTIVE:
${filters.length > 0 ? filters.join(", ") : "None. Suggest any optimal recipe."}

INSTRUCTIONS:
1. Make sure the recipe relies as much as possible on the available pantry items, especially items marked as [Expiring Soon].
2. Provide a realistic prep/cook time, calorie count, protein, and carbs value.
3. The tags array should represent diet and style (e.g. "Vegetarian", "High Protein", "Quick", "Low Carb").
4. Provide logical, step-by-step preparation steps. Each step must have a unique sequential id (e.g. "s1", "s2", "s3") and a description.
5. If a step involves a countdown timer (e.g. simmering, baking, boiling), include "timerMinutes" as an integer representing the duration.
6. For the "image" field, select a high-quality Unsplash food image URL related to the recipe. Use a standard format like "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop".
7. Return a single JSON object matching the requested schema. Do not output any codeblock formatting or introductory text, just the raw JSON.`;

    // 4. Call Vertex AI
    let recipeData: any = null;
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              image: { type: "STRING" },
              rating: { type: "NUMBER" },
              timeMinutes: { type: "INTEGER" },
              calories: { type: "INTEGER" },
              protein: { type: "INTEGER" },
              carbs: { type: "INTEGER" },
              tags: {
                type: "ARRAY",
                items: { type: "STRING" },
              },
              steps: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    description: { type: "STRING" },
                    timerMinutes: { type: "INTEGER" },
                  },
                  required: ["id", "description"],
                },
              },
            },
            required: [
              "title",
              "image",
              "rating",
              "timeMinutes",
              "calories",
              "protein",
              "carbs",
              "tags",
              "steps",
            ],
          },
        },
      });

      const text = response.text || "";
      recipeData = JSON.parse(text);
    } catch (aiError) {
      console.error("Vertex AI Recipe generation failed. Falling back to local recipes.", aiError);
      
      // Select fallback recipe based on active filters
      const isVeg = filters.some((f: string) => f.toLowerCase().includes("veg"));
      const hasChicken = pantryItems.some((i: any) => i.name.toLowerCase().includes("chicken"));

      if (isVeg) {
        recipeData = FALLBACK_RECIPES.veg;
      } else if (hasChicken) {
        recipeData = FALLBACK_RECIPES.chicken;
      } else {
        recipeData = FALLBACK_RECIPES.default;
      }
      recipeData.isFallback = true;
    }

    // 5. Store generated recipe in Firestore (if firestore is active)
    if (recipeData) {
      try {
        const recipeRef = await adminDb.collection("recipes").add({
          ...recipeData,
          createdAt: new Date().toISOString(),
          filters,
        });
        recipeData.id = recipeRef.id;
      } catch (firestoreError) {
        console.warn("Could not save matched recipe to Firestore (skipping):", firestoreError);
        if (!recipeData.id) {
          recipeData.id = "local-" + Math.random().toString(36).substr(2, 9);
        }
      }
    }

    return NextResponse.json({ success: true, recipe: recipeData });
  } catch (error: any) {
    console.error("Match Recipe API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to match recipe" },
      { status: 500 }
    );
  }
}

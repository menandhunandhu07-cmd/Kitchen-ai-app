import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldSeed = searchParams.get("seed") === "true";

    const snapshot = await adminDb.collection("pantry").get();
    let items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    // Auto-seed if database is empty or if seed=true is explicitly requested
    if (items.length === 0 || shouldSeed) {
      const batch = adminDb.batch();
      for (const item of MOCK_PANTRY) {
        const docRef = adminDb.collection("pantry").doc(item.id);
        batch.set(docRef, {
          name: item.name,
          quantity: item.quantity,
          freshness: item.freshness,
          icon: item.icon,
          createdAt: new Date().toISOString(),
        });
      }
      await batch.commit();

      // Refetch from database
      const newSnapshot = await adminDb.collection("pantry").get();
      items = newSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Firestore pantry GET error:", error);
    // Fallback to mock pantry if Firebase is not properly configured
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch pantry from Firestore",
      items: MOCK_PANTRY,
      isFallback: true,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, quantity, freshness, icon } = body;

    if (!name || !quantity) {
      return NextResponse.json(
        { success: false, error: "Name and quantity are required" },
        { status: 400 }
      );
    }

    const itemData = {
      name,
      quantity,
      freshness: freshness || "fresh",
      icon: icon || "🥑",
      updatedAt: new Date().toISOString(),
    };

    let docId = id;
    if (docId) {
      // Update
      await adminDb.collection("pantry").doc(docId).set(itemData, { merge: true });
    } else {
      // Create
      const docRef = await adminDb.collection("pantry").add({
        ...itemData,
        createdAt: new Date().toISOString(),
      });
      docId = docRef.id;
    }

    return NextResponse.json({
      success: true,
      item: { id: docId, ...itemData },
    });
  } catch (error: any) {
    console.error("Firestore pantry POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save pantry item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 }
      );
    }

    await adminDb.collection("pantry").doc(id).delete();
    return NextResponse.json({ success: true, message: `Item ${id} deleted` });
  } catch (error: any) {
    console.error("Firestore pantry DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete pantry item" },
      { status: 500 }
    );
  }
}

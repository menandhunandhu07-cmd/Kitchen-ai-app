import * as admin from "firebase-admin";
import { initCredentials } from "./credentials";

if (!admin.apps.length) {
  try {
    const serviceAccount = initCredentials();

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Try to initialize using default credentials (e.g. if GOOGLE_APPLICATION_CREDENTIALS env var is set)
      admin.initializeApp();
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

const adminDb = admin.firestore();

// Ensure collections are helper-ready and settings are correct
try {
  adminDb.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Settings can only be configured once, catch if already set
}

export { admin, adminDb };

import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

if (!admin.apps.length) {
  try {
    let serviceAccount: any = null;

    // Resolve path relative to process.cwd() (project root)
    const keyPath = path.resolve(process.cwd(), "service-account-key.json");

    if (fs.existsSync(keyPath)) {
      const keyFile = fs.readFileSync(keyPath, "utf8");
      serviceAccount = JSON.parse(keyFile);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }

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

import fs from "fs";
import path from "path";
import os from "os";

export function initCredentials() {
  let credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  // Resolve relative paths (like "./service-account-key.json") to absolute paths
  if (credentialsPath && !path.isAbsolute(credentialsPath)) {
    credentialsPath = path.resolve(process.cwd(), credentialsPath);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
  }

  // If the credentials file is not found locally, and we have the raw service account JSON string,
  // write it to a temporary file so Google Application Default Credentials (ADC) can resolve it.
  if (
    (!credentialsPath || !fs.existsSync(credentialsPath)) &&
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ) {
    try {
      const tmpKeyPath = path.join(os.tmpdir(), "service-account-key.json");
      fs.writeFileSync(tmpKeyPath, process.env.FIREBASE_SERVICE_ACCOUNT_KEY, "utf8");
      
      // Update environment variable for underlying GCP/auth SDKs
      process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpKeyPath;
      credentialsPath = tmpKeyPath;
    } catch (err) {
      console.error("Failed to write temporary service-account-key.json:", err);
    }
  }

  // Load and return the parsed service account object (useful for Firebase Admin SDK cert)
  let serviceAccount: any = null;
  if (credentialsPath && fs.existsSync(credentialsPath)) {
    try {
      const fileContent = fs.readFileSync(credentialsPath, "utf8");
      serviceAccount = JSON.parse(fileContent);
    } catch (e) {
      console.error("Failed to parse credentials file:", e);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var:", e);
    }
  }

  return serviceAccount;
}

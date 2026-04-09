import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously, type User } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredEnvKeys = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_DATABASE_URL",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

let signInPromise: Promise<User> | null = null;

export function getOnlineFeatureStatus() {
  const missingKeys = requiredEnvKeys.filter((key) => !import.meta.env[key]);

  return {
    enabled: missingKeys.length === 0,
    missingKeys,
    message:
      missingKeys.length === 0
        ? ""
        : `オンライン対戦を使うには環境変数を設定してください: ${missingKeys.join(", ")}`,
  };
}

function getFirebaseApp() {
  if (!getOnlineFeatureStatus().enabled) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseDatabase() {
  const app = getFirebaseApp();
  return app ? getDatabase(app) : null;
}

function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

export async function ensureSignedInAnonymously(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(getOnlineFeatureStatus().message);
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  if (!signInPromise) {
    signInPromise = signInAnonymously(auth)
      .then((credential) => credential.user)
      .finally(() => {
        signInPromise = null;
      });
  }

  return signInPromise;
}

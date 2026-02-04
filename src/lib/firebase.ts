import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missing = requiredKeys.filter((k) => !firebaseConfig[k]);
if (missing.length) {
  // This usually happens when `.env` wasn't loaded (dev server not restarted) or variables are named incorrectly.
  // We throw early so Firestore doesn't fail with confusing "offline" errors.
  throw new Error(
    `Missing Firebase env vars: ${missing
      .map((k) => `VITE_FIREBASE_${String(k).toUpperCase()}`)
      .join(', ')}. Check your .env and restart the dev server.`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const forceLongPolling = String(import.meta.env.VITE_FIREBASE_FORCE_LONG_POLLING ?? '') === 'true';

export const db = forceLongPolling
  ? initializeFirestore(app, {
      // Helps in some campus networks / proxies where WebChannel/WebSocket gets blocked.
      experimentalForceLongPolling: true,
    })
  : getFirestore(app);

export default app;

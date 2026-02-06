import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

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

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (missing.length) {
  // Warn instead of throwing so the landing page still renders without Firebase config.
  console.warn(
    `[Firebase] Missing env vars: ${missing
      .map((k) => `VITE_FIREBASE_${String(k).toUpperCase()}`)
      .join(', ')}. Firebase features (registration, admin) will be unavailable. ` +
    `Add a .env file and restart the dev server to enable them.`
  );
} else {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize services
  const forceLongPolling = String(import.meta.env.VITE_FIREBASE_FORCE_LONG_POLLING ?? '') === 'true';

  db = forceLongPolling
    ? initializeFirestore(app, {
        experimentalForceLongPolling: true,
      })
    : getFirestore(app);
}

export { db };
export default app;

/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Environment variables from Vite (with fallback placeholder)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyPlaceholderForAppToBuild",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "talentsphere-applet.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "talentsphere-applet",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "talentsphere-applet.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456"
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export Firebase Auth & Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 初始化 Firebase 應用程式
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 關鍵修復：只在瀏覽器環境 (Client-side) 才啟動 Auth 與 Firestore
// 這樣就能完美避開 Vercel 在 Server-side 預先打包時的報錯
const db = typeof window !== "undefined" ? getFirestore(app) : ({} as any);
const auth = typeof window !== "undefined" ? getAuth(app) : ({} as any);

export { app, db, auth };

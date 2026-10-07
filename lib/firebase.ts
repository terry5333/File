// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// 加上 || "未設定" 的預設值，防止 Firebase 吃到 undefined 直接崩潰
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "未設定",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "未設定",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "未設定",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "未設定",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "未設定",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "未設定",
};

let app: any;
let db: any = null;
let auth: any = null;

// 只在瀏覽器環境啟動，且包裝在 try...catch 中，嚴格防止當機
if (typeof window !== "undefined") {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase 初始化嚴重錯誤:", error);
  }
}

export { app, db, auth };

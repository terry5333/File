// app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔒 安全白名單：只有寫在這裡的 Google 信箱才能登入管理後台！
  const ADMIN_EMAILS = [
    "terrylie0215@gmail.com", // ← ⚠️ 請務必把它改成你自己的 Google 信箱
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // 檢查登入的信箱是否在白名單內
        if (ADMIN_EMAILS.includes(currentUser.email || "")) {
          setUser(currentUser);
          setError("");
        } else {
          // 不在白名單內，強制登出並阻擋
          signOut(auth);
          setError(`權限不足：信箱 ${currentUser.email} 不是管理員帳號`);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setError("");
    const provider = new GoogleAuthProvider();
    // 強制每次登入都選擇帳號，避免瀏覽器自動用錯誤的帳號登入
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google 登入失敗", err);
      setError("登入失敗，請重試或檢查網路連線。");
    }
  };

  const handleLogout = async () => {
    if (confirm("確定要登出管理員身分嗎？")) {
      await signOut(auth);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-medium">
        系統驗證中...
      </div>
    );
  }

  // 如果尚未登入，顯示 Google 登入按鈕
  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-4">
        <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

        <div className="relative z-10 bg-white/60 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] shadow-lg border border-white/80 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-white text-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
            {/* Google G Logo SVG */}
            <svg className="w-8 h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">管理員登入</h1>
          <p className="text-sm text-slate-500 mt-1 mb-8">請使用具備授權的 Google 帳號登入</p>

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 transition-all"
            >
              使用 Google 帳號登入
            </button>
            
            {error && (
              <p className="text-red-500 text-sm font-medium bg-red-50 py-3 rounded-lg border border-red-100 px-2 break-words">
                {error}
              </p>
            )}

            <div className="pt-2">
               <Link href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">
                 ← 返回系統首頁
               </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 驗證成功，放行進入 admin 裡面的頁面，並在上方提供一個整齊的登出列
  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col">
      {/* 頂部導覽/登出列 */}
      <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <span className="text-sm font-bold text-slate-700 hidden sm:inline">管理員後台</span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-500 truncate max-w-[150px] sm:max-w-xs">
            {user.email}
          </span>
          <button 
            onClick={handleLogout}
            className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold rounded-lg border border-slate-200 hover:border-red-200 transition-all whitespace-nowrap"
          >
            登出
          </button>
        </div>
      </div>

      {/* 主要內容區塊 */}
      <div className="flex-1 relative z-10">
        {children}
      </div>
    </div>
  );
}

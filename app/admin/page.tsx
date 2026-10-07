// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sysError, setSysError] = useState("");
  const router = useRouter();

  useEffect(() => {
    try {
      if (!auth || !auth.onAuthStateChanged) return;
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          fetchProjects();
        } else {
          setLoading(false);
        }
      });
      return () => unsubscribe();
    } catch (error: any) {
      setSysError(error.message);
    }
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const projData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projData);
    } catch (error: any) {
      setSysError("讀取專案失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setSysError("");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setSysError("登入失敗: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProjects([]);
  };

  // 尚未登入：磨砂玻璃登入頁
  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-800">
        {/* 背景漸層氛圍光暈 */}
        <div className="absolute top-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-blue-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-[30rem] h-[30rem] bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[30rem] h-[30rem] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>

        {/* 懸浮玻璃卡片 */}
        <div className="relative z-10 w-full max-w-sm p-10 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_8px_40px_0_rgba(31,38,135,0.07)] text-center transition-all">
          <div className="w-20 h-20 bg-white/70 rounded-2xl shadow-sm border border-white flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">專案管理系統</h1>
          <p className="text-sm text-slate-500 mb-8 font-medium">302 檔案收取與狀態監控</p>

          {sysError && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-md text-red-600 text-sm rounded-xl border border-red-100 shadow-sm break-words text-left">
              {sysError}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full relative group overflow-hidden bg-white/70 backdrop-blur-lg border border-white/80 text-slate-700 font-semibold py-3.5 px-4 rounded-xl shadow-sm hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              使用 Google 帳號登入
            </span>
          </button>
        </div>
        
        <div className="absolute bottom-6 z-10 text-xs font-semibold text-slate-400/80 tracking-wider">
          made by Terry L.
        </div>
      </div>
    );
  }

  // 登入後：管理儀表板
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10">
      {/* 延續光暈背景 */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* 頂部導航玻璃卡 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5 bg-white/40 backdrop-blur-2xl border border-white/60 p-6 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/80 rounded-2xl shadow-sm border border-white flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">專案看板</h1>
              <p className="text-sm text-slate-500 font-medium truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={() => router.push("/admin/create")} className="flex-1 md:flex-none px-6 py-3 bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5">
              + 新增專案
            </button>
            <button onClick={handleLogout} className="px-6 py-3 bg-white/60 hover:bg-white backdrop-blur-md text-slate-700 font-medium border border-white/80 text-sm rounded-xl shadow-sm transition-all">
              登出
            </button>
          </div>
        </header>

        {/* 專案列表區域 */}
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium animate-pulse">正在載入專案資料...</div>
        ) : projects.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-16 rounded-[2rem] text-center shadow-sm">
            <div className="w-16 h-16 bg-white/60 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            </div>
            <p className="text-slate-500 font-medium mb-1">目前還沒有任何專案</p>
            <p className="text-sm text-slate-400">點擊右上方按鈕開始建立第一個專案</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="group bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] hover:bg-white/60 hover:shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-lg font-bold text-slate-800 line-clamp-1">{project.name}</h2>
                  </div>
                  <div className="space-y-2 mb-6">
                    <p className="text-xs font-medium text-slate-500 bg-white/50 inline-block px-2.5 py-1 rounded-lg border border-white/60">ID: {project.id}</p>
                    <p className="text-sm text-slate-500">需收取 <span className="font-semibold text-slate-700">{project.fileRequirements?.length || 0}</span> 個檔案</p>
                  </div>
                </div>
                <Link href={`/admin/${project.id}`} className="block text-center w-full py-2.5 bg-white/50 border border-white/80 text-blue-600 font-medium text-sm rounded-xl group-hover:bg-blue-50/50 transition-all">
                  進入管理
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

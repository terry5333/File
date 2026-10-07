// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
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

  const handleLogout = async () => {
    await signOut(auth);
    setProjects([]);
  };

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm p-10 bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-[0_8px_40px_0_rgba(31,38,135,0.07)] text-center">
          <h1 className="text-2xl font-bold mb-2 text-slate-800">請先登入</h1>
          <p className="text-sm text-slate-500 mb-6">管理員後台驗證</p>
          <Link href="/admin" className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md">
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-purple-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-5 bg-white/40 backdrop-blur-2xl border border-white/60 p-6 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/80 rounded-2xl shadow-sm border border-white flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">專案總覽</h1>
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

        {sysError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
            {sysError}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500 font-medium animate-pulse">正在載入專案資料...</div>
        ) : projects.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-16 rounded-[2rem] text-center shadow-sm">
            <p className="text-slate-500 font-medium mb-1">目前還沒有任何專案</p>
            <p className="text-sm text-slate-400">點擊右上角按鈕開始建立第一個專案</p>
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

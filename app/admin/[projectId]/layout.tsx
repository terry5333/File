// app/admin/[projectId]/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const [project, setProject] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    getDoc(doc(db, "projects", params.projectId)).then((snap) => {
      if (snap.exists()) setProject(snap.data());
    });
  }, [params.projectId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const studentUrl = `${origin}/p/${params.projectId}`;
  const teacherUrl = `${origin}/teacher/${params.projectId}?token=${project?.teacherToken}`;

  const copyToClipboard = (url: string, type: string) => {
    navigator.clipboard.writeText(url);
    alert(`已複製${type}連結！\n${url}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10">
      {/* 延續玻璃光暈背景 */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* 頂部導航卡片 */}
        <header className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              {/* 「切換專案」按鈕：隨時跳回專案列表 */}
              <Link 
                href="/admin" 
                className="px-4 py-2.5 bg-white/60 hover:bg-white backdrop-blur-md rounded-xl flex items-center gap-2 text-slate-700 font-medium text-sm shadow-sm transition-all border border-white/80"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
                切換專案
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                  {project?.name || "載入專案中..."}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium">專案 ID: {params.projectId}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => copyToClipboard(studentUrl, "學生端")}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 font-medium text-sm rounded-xl border border-blue-200/50 shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                </svg>
                學生連結
              </button>
              <button
                onClick={() => copyToClipboard(teacherUrl, "導師端")}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-700 font-medium text-sm rounded-xl border border-indigo-200/50 shadow-sm transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                導師連結
              </button>
            </div>
          </div>

          {/* 分頁切換 */}
          <nav className="flex space-x-2 border-b border-white/40 pb-1">
            <Link
              href={`/admin/${params.projectId}`}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                pathname === `/admin/${params.projectId}`
                  ? "bg-white/80 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
              }`}
            >
              繳交狀態看板
            </Link>
            <Link
              href={`/admin/${params.projectId}/students`}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                pathname.includes("/students")
                  ? "bg-white/80 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
              }`}
            >
              學生名單管理
            </Link>
          </nav>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

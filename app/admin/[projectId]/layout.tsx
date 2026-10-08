// app/admin/[projectId]/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const [project, setProject] = useState<any>(null);
  const pathname = usePathname(); // 用來判斷目前在哪個分頁，改變 Tab 顏色

  useEffect(() => {
    getDoc(doc(db, "projects", params.projectId)).then((snap) => {
      if (snap.exists()) setProject({ id: snap.id, ...snap.data() });
    });
  }, [params.projectId]);

  const copyStudentLink = () => {
    const link = `${window.location.origin}/${params.projectId}`;
    navigator.clipboard.writeText(link);
    alert("🔗 學生上傳連結已複製到剪貼簿！\n\n您現在可以直接把這個連結貼給學生了。");
  };

  if (!project) return <div className="p-12 text-center text-slate-500">載入專案資訊中...</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* 🌟 頂部精緻卡片 */}
      <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100">
        
        {/* 標題與返回鈕 */}
        <div className="flex items-center gap-4 mb-5">
          <Link href="/admin" className="flex flex-col items-center justify-center w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 hover:bg-slate-100 transition-colors shrink-0">
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            <span className="text-[10px] font-bold">切換專案</span>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">{project.name}</h1>
            <p className="text-[11px] text-slate-400 mt-1 font-mono bg-slate-50 inline-block px-2 py-0.5 rounded">專案 ID: {project.id}</p>
          </div>
        </div>

        {/* 滿版大按鈕：複製學生上傳連結 */}
        <button 
          onClick={copyStudentLink}
          className="w-full py-3.5 mb-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
          複製學生上傳連結
        </button>

        {/* 頁籤 Tab */}
        <div className="flex p-1 bg-slate-50/80 rounded-2xl border border-slate-100">
          <Link 
            href={`/admin/${params.projectId}`} 
            className={`flex-1 py-2.5 text-sm font-bold text-center rounded-xl transition-colors ${pathname === `/admin/${params.projectId}` ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100/50'}`}
          >
            繳交狀態看板
          </Link>
          <Link 
            href={`/admin/${params.projectId}/students`} 
            className={`flex-1 py-2.5 text-sm font-bold text-center rounded-xl transition-colors ${pathname === `/admin/${params.projectId}/students` ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100/50'}`}
          >
            學生名單管理
          </Link>
        </div>
      </div>

      {/* 下方的子頁面內容 (包含 page.tsx 與 students/page.tsx) */}
      <div className="relative z-10">
        {children}
      </div>

    </div>
  );
}

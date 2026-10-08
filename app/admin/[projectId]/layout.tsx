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
  const pathname = usePathname();

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

  if (!project) return <div className="p-12 text-center text-slate-500 font-medium">載入專案資訊中...</div>;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 relative">
      
      {/* 加上跟首頁一樣的光暈，讓毛玻璃效果更明顯 */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none z-0"></div>

      {/* 🌟 舊版超美玻璃質感頂部卡片 (復刻截圖排版) */}
      <div className="relative z-10 bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] border border-white/60">
        
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="flex flex-col items-center justify-center w-[4.5rem] h-[4.5rem] bg-white/60 border border-white/80 rounded-2xl text-slate-600 hover:bg-white shadow-sm transition-all shrink-0">
            <svg className="w-5 h-5 mb-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            <span className="text-[10px] font-bold">切換專案</span>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 truncate">{project.name}</h1>
            <p className="text-[11px] text-slate-500 mt-1.5 font-mono bg-white/60 inline-block px-2.5 py-1 rounded-lg border border-white/80 shadow-sm">
              專案 ID: {project.id}
            </p>
          </div>
        </div>

        {/* 滿版大按鈕：複製學生上傳連結 */}
        <button 
          onClick={copyStudentLink}
          className="w-full py-4 mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
          複製學生上傳連結
        </button>

        {/* 毛玻璃頁籤 Tab */}
        <div className="flex gap-3">
          <Link 
            href={`/admin/${params.projectId}`} 
            className={`flex-1 py-3.5 text-sm font-bold text-center rounded-xl transition-all shadow-sm ${pathname === `/admin/${params.projectId}` ? 'bg-white text-blue-600 border border-white/80' : 'bg-white/40 text-slate-600 hover:bg-white/60 border border-transparent'}`}
          >
            繳交狀態看板
          </Link>
          <Link 
            href={`/admin/${params.projectId}/students`} 
            className={`flex-1 py-3.5 text-sm font-bold text-center rounded-xl transition-all shadow-sm ${pathname === `/admin/${params.projectId}/students` ? 'bg-white text-blue-600 border border-white/80' : 'bg-white/40 text-slate-600 hover:bg-white/60 border border-transparent'}`}
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

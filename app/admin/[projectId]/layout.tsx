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
    <div className="p-4 md:p-10 max-w-6xl mx-auto space-y-6">
      
      {/* 🌟 舊版超美玻璃質感頂部卡片 */}
      <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] border border-white/60">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline mb-4 inline-block font-medium">← 返回專案總覽</Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/50 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{project.name}</h1>
            <span className="font-mono text-xs bg-white/60 text-slate-500 px-3 py-1 rounded-lg border border-white/80 shadow-sm">
              專案 ID: {project.id}
            </span>
          </div>
          
          <button 
            onClick={copyStudentLink}
            className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
            複製學生上傳連結
          </button>
        </div>

        <div className="flex gap-4">
          <Link 
            href={`/admin/${params.projectId}`} 
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-sm ${pathname === `/admin/${params.projectId}` ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}
          >
            繳交狀態看板
          </Link>
          <Link 
            href={`/admin/${params.projectId}/students`} 
            className={`px-6 py-3 font-bold rounded-xl transition-all shadow-sm ${pathname === `/admin/${params.projectId}/students` ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}
          >
            學生名單管理
          </Link>
        </div>
      </div>

      <div className="relative z-10">
        {children}
      </div>

    </div>
  );
}

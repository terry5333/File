"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        setProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {} finally { setLoading(false); }
    };
    fetchProjects();
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-50/50"></div>;

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/50 p-4 md:p-8">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border border-white/80 rounded-2xl flex items-center justify-center shadow-sm text-blue-600"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg></div>
            <h1 className="text-2xl font-bold text-slate-800">專案總覽</h1>
          </div>
          <Link href="/admin/create" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all">+ 新增專案</Link>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-12 rounded-[2rem] text-center shadow-sm"><h3 className="text-xl font-bold text-slate-700">目前沒有專案</h3></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 rounded-[2rem] shadow-sm hover:bg-white/50 transition-all flex flex-col h-full">
                <h3 className="text-xl font-bold text-slate-800 mb-1 line-clamp-1">{project.name}</h3>
                <div className="mb-6"><span className="text-[11px] text-slate-500 font-mono bg-white/60 px-2.5 py-1 rounded-lg border border-white/80 shadow-sm">ID: {project.id}</span></div>
                <div className="space-y-1 mb-6 flex-1">
                  <p className="text-sm text-slate-600 font-medium">檔案數 <span className="font-bold text-slate-800 mx-1">{project.fileRequirements?.length || 0}</span></p>
                  <p className="text-sm text-slate-600 font-medium">學生數 <span className="font-bold text-slate-800 mx-1">{project.students?.length || 0}</span></p>
                </div>
                <Link href={`/admin/${project.id}`} className="w-full py-3 bg-white/80 hover:bg-white text-blue-600 font-bold text-sm text-center rounded-xl shadow-sm border border-white/80 transition-all">進入管理</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

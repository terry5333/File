// app/admin/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProjectDashboardPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const snap = await getDoc(doc(db, "projects", params.projectId));
        if (snap.exists()) {
          setProject(snap.data());
        }
      } catch (error) {
        console.error("載入專案失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [params.projectId]);

  if (loading) {
    return (
      <div className="bg-white/45 backdrop-blur-2xl border border-white/60 p-12 rounded-[2rem] text-center text-slate-500 shadow-sm">
        載入中...
      </div>
    );
  }

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];

  return (
    <div className="bg-white/45 backdrop-blur-2xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">全班檔案繳交狀態</h2>
          <p className="text-sm text-slate-500 mt-1">
            即時監控學生作業與檔案繳交進度
          </p>
        </div>
        <div className="px-4 py-2 bg-blue-50/80 border border-blue-100 rounded-xl text-blue-700 font-semibold text-sm">
          已註冊學生：{students.length} 位
        </div>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white/30 rounded-2xl border border-white/50 border-dashed">
          <p className="font-medium mb-1">目前尚未建立學生名單</p>
          <p className="text-xs text-slate-400">請先至上方切換到「學生名單管理」分頁新增學生</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/60 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">座號</th>
                <th className="py-3 px-4">姓名</th>
                {requirements.map((req: any, idx: number) => (
                  <th key={idx} className="py-3 px-4">{req.title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 text-sm">
              {students.map((student: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">{student.seat}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{student.name}</td>
                  {requirements.map((req: any, rIdx: number) => (
                    <td key={rIdx} className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg text-xs font-medium">
                        未繳交
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

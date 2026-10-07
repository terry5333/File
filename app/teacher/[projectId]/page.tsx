// app/teacher/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TeacherProjectDashboardPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, setProject] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const snap = await getDoc(doc(db, "projects", params.projectId));
        if (snap.exists()) {
          const data = snap.data();
          // 自動修復舊專案缺少 id 的問題 (保持預覽功能正常)
          if (data.fileRequirements) {
            data.fileRequirements = data.fileRequirements.map((req: any, idx: number) => ({
              ...req,
              id: req.id || `req_legacy_${idx}`
            }));
          }
          setProject(data);
          
          // 抓取繳交紀錄
          const subSnap = await getDocs(collection(db, "projects", params.projectId, "submissions"));
          const subs = subSnap.docs.map(d => d.data());
          setSubmissions(subs);
        }
      } catch (error) {
        console.error("載入專案失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [params.projectId]);

  // 預覽單一檔案
  const handlePreview = async (fileKey: string) => {
    try {
      const res = await fetch("/api/sign/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey })
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank"); // 另開分頁預覽
      } else {
        throw new Error("無法取得網址");
      }
    } catch (error) {
      console.error(error);
      alert("預覽失敗，請重試。");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        載入資料中...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">找不到此專案</h1>
          <p className="text-sm text-slate-500">請確認網址是否正確</p>
        </div>
      </div>
    );
  }

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10">
      {/* 導師端專屬的柔和背景光暈 */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-teal-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto bg-white/45 backdrop-blur-2xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
        
        {/* 頂部導覽列與標題 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200/50 pb-6">
          <div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-semibold text-xs rounded-lg mb-3 inline-block">導師檢視專區</span>
            <h2 className="text-2xl font-bold text-slate-800">{project.name}</h2>
            <p className="text-sm text-slate-500 mt-1">
              僅供查看班級學生繳交狀況與預覽檔案
            </p>
          </div>
          <div className="px-5 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-slate-700 font-semibold text-sm shadow-sm">
            全班人數：{students.length} 位
          </div>
        </div>

        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white/30 rounded-2xl border border-white/50 border-dashed">
            <p className="font-medium">此專案尚未匯入學生名單</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-4 bg-white/20">座號</th>
                  <th className="py-4 px-4 bg-white/20">姓名</th>
                  {requirements.map((req: any, idx: number) => (
                    <th key={idx} className="py-4 px-4 bg-white/20">{req.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40 text-sm">
                {students.map((student: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/40 transition-colors">
                    <td className="py-4 px-4 font-mono text-slate-600 font-semibold">{student.seat}</td>
                    <td className="py-4 px-4 font-bold text-slate-800">{student.name}</td>
                    {requirements.map((req: any, rIdx: number) => {
                      const submission = submissions.find(
                        s => s.studentCode === student.code && s.reqId === req.id
                      );
                      
                      return (
                        <td key={rIdx} className="py-4 px-4">
                          {submission ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-xs font-medium">
                                ✅ 已繳交
                              </span>
                              {/* 導師專屬的預覽按鈕 */}
                              <button
                                onClick={() => handlePreview(submission.fileKey)}
                                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-600 font-semibold text-xs rounded-lg border border-slate-200 shadow-sm transition-colors"
                              >
                                預覽檔案
                              </button>
                            </div>
                          ) : (
                            <span className="inline-block px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg text-xs font-medium">
                              未繳交
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

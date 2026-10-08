// app/teacher/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TeacherProjectDashboardPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [identity, setIdentity] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "projects", params.projectId));
        if (snap.exists()) {
          const data = snap.data();
          const urlParams = new URLSearchParams(window.location.search);
          const urlToken = urlParams.get("token");

          // 🔒 身分驗證 (雙軌並行：相容舊版單一連結 與 新版多重連結)
          if (data.teacherToken && data.teacherToken === urlToken) {
            setIdentity({ name: "導師 (舊版連結)", role: "導師", token: urlToken });
          } else {
            const foundCollab = (data.collaborators || []).find((c: any) => c.token === urlToken);
            if (foundCollab) {
              setIdentity(foundCollab);
            } else {
              setLoading(false);
              return; 
            }
          }
          
          if (data.fileRequirements) {
            data.fileRequirements = data.fileRequirements.map((req: any, idx: number) => ({
              ...req,
              id: req.id || `req_legacy_${idx}`
            }));
          }
          setProject(data);
          
          const subSnap = await getDocs(collection(db, "projects", params.projectId, "submissions"));
          setSubmissions(subSnap.docs.map(d => d.data()));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.projectId]);

  const handlePreview = async (fileKey: string) => {
    const res = await fetch("/api/sign/read", { method: "POST", body: JSON.stringify({ fileKey }) });
    const data = await res.json();
    window.open(data.url, "_blank");
  };

  // 🌟 移除任何「驗證中」文字，只顯示乾淨的背景
  if (loading) return <div className="min-h-screen bg-slate-50/50"></div>;

  // 🛑 驗證失敗的專屬阻擋畫面
  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4">
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-red-100 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">存取遭拒</h1>
          <p className="text-sm text-slate-500 font-medium">您的專屬連結無效或已過期，請聯絡管理員重新產生。</p>
        </div>
      </div>
    );
  }

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/50 p-4 md:p-10 flex flex-col items-center">
      {/* 導師專屬的綠色系背景光暈 */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-teal-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl space-y-6">
        
        {/* 🌟 頂部歡迎卡片 */}
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 font-bold text-xs rounded-lg shadow-sm border border-white/80 ${identity.role === '導師' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {identity.role} 檢視模式
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
            <p className="text-sm text-slate-600 mt-2 font-medium">
              歡迎登入，<span className="font-bold text-slate-800 text-base mx-1">{identity.name}</span>！您可以在此檢視班級繳交進度。
            </p>
          </div>
          <div className="px-5 py-3 bg-white/80 border border-white/80 rounded-xl text-slate-700 font-bold text-sm shadow-sm flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            全班人數：{students.length} 位
          </div>
        </div>

        {/* 🌟 繳交狀況看板 (最高質感，並清晰標示上傳規則) */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-8 rounded-[2rem] shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            全班繳交狀況
          </h2>

          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white/30 rounded-2xl border border-white/50 border-dashed">
              <p className="font-bold">此專案尚未匯入學生名單</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/80 bg-white/40 shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white/60 border-b border-white/80">
                  <tr>
                    <th className="py-4 px-5 text-slate-600 font-bold">座號/姓名</th>
                    {/* 🌟 清晰標示檔案格式需求 */}
                    {requirements.map((req: any) => (
                      <th key={req.id} className="py-4 px-5 text-slate-600 font-bold">
                        <div className="flex flex-col">
                          <span>{req.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5 bg-white/60 px-1.5 py-0.5 rounded inline-block max-w-max border border-white/80">
                            格式: {req.ext}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60">
                  {students.map((student: any) => (
                    <tr key={student.code} className="hover:bg-white/60 transition-colors">
                      <td className="py-4 px-5 font-bold text-slate-700 text-base">{student.seat} <span className="ml-1">{student.name}</span></td>
                      {requirements.map((req: any) => {
                        const sub = submissions.find(s => s.studentCode === student.code && s.reqId === req.id);
                        return (
                          <td key={req.id} className="py-4 px-5">
                            {sub ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md font-bold shadow-sm">✅ 已交</span>
                                  <button onClick={() => handlePreview(sub.fileKey)} className="text-xs text-blue-600 hover:text-blue-800 font-bold border border-blue-200 bg-blue-50 px-2 py-1 rounded-md transition-colors">預覽</button>
                                  {/* 教師端僅能檢視，不能退回檔案，確保安全 */}
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono ml-1">
                                  {new Date(sub.submittedAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ) : <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1.5 rounded-md font-bold">未繳交</span>}
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
    </div>
  );
}

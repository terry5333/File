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

          if (data.teacherToken && data.teacherToken === urlToken) {
            setIdentity({ name: "導師", role: "導師", token: urlToken });
          } else {
            const foundCollab = (data.collaborators || []).find((c: any) => c.token === urlToken);
            if (foundCollab) setIdentity(foundCollab);
            else return; 
          }
          setProject(data);
          const subSnap = await getDocs(collection(db, "projects", params.projectId, "submissions"));
          setSubmissions(subSnap.docs.map(d => d.data()));
        }
      } catch (error) {} finally { setLoading(false); }
    };
    fetchData();
  }, [params.projectId]);

  const handlePreview = async (fileKey: string) => {
    const res = await fetch("/api/sign/read", { method: "POST", body: JSON.stringify({ fileKey }) });
    const data = await res.json();
    window.open(data.url, "_blank");
  };

  // 🌟 移除文字與轉圈動畫，直接給乾淨的背景
  if (loading) return <div className="min-h-screen bg-slate-50"></div>;

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white/60 p-8 rounded-[2rem] shadow-lg text-center max-w-sm w-full"><h1 className="text-2xl font-bold text-slate-800">存取遭拒</h1></div>
      </div>
    );
  }

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10 flex flex-col items-center">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-teal-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-6xl space-y-6">
        <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{project.name}</h1>
            <p className="text-sm font-bold text-slate-600 mt-2">歡迎，{identity.name}</p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/80 p-8 rounded-[2rem] shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-6">全班繳交狀況</h2>
          <div className="overflow-x-auto rounded-xl border border-white/80 bg-white/40">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/60 border-b border-white/80">
                <tr>
                  <th className="py-4 px-5 text-slate-600 font-bold">座號/姓名</th>
                  {requirements.map((req: any) => <th key={req.id} className="py-4 px-5 text-slate-600 font-bold">{req.title}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/60">
                {students.map((student: any) => (
                  <tr key={student.code}>
                    <td className="py-4 px-5 font-bold text-slate-700 text-base">{student.seat} <span className="ml-1">{student.name}</span></td>
                    {requirements.map((req: any) => {
                      const sub = submissions.find(s => s.studentCode === student.code && s.reqId === req.id);
                      return (
                        <td key={req.id} className="py-4 px-5">
                          {sub ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md font-bold shadow-sm">✅ 已交</span>
                              <button onClick={() => handlePreview(sub.fileKey)} className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">預覽</button>
                            </div>
                          ) : <span className="text-xs bg-amber-50 text-amber-600 px-2.5 py-1.5 rounded-md font-bold">未繳交</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

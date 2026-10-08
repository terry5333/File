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

          // 驗證 Token 是否存在於 collaborators 陣列
          const foundCollab = (data.collaborators || []).find((c: any) => c.token === urlToken);
          if (!foundCollab) {
            setLoading(false);
            return; // 驗證失敗，identity 為 null
          }
          
          setIdentity(foundCollab);
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

  if (loading) return <div className="p-12 text-center">驗證身分中...</div>;

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow border border-red-200 text-center">
          <h1 className="text-xl font-bold text-red-500 mb-2">❌ 存取遭拒</h1>
          <p className="text-slate-500">專屬連結無效或已失效，請聯絡管理員。</p>
        </div>
      </div>
    );
  }

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-6 border-b pb-4">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">身分：{identity.role}</span>
          <h2 className="text-2xl font-bold mt-2">{project.name}</h2>
          <p className="text-slate-500 mt-1">歡迎登入，{identity.name}！您可以在此檢視繳交進度。</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-3 px-4">座號/姓名</th>
                {requirements.map((req: any) => <th key={req.id} className="py-3 px-4">{req.title}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student: any) => (
                <tr key={student.code} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold">{student.seat} {student.name}</td>
                  {requirements.map((req: any) => {
                    const sub = submissions.find(s => s.studentCode === student.code && s.reqId === req.id);
                    return (
                      <td key={req.id} className="py-3 px-4">
                        {sub ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">✅ 已交</span>
                              <button onClick={() => handlePreview(sub.fileKey)} className="text-xs text-blue-600 underline">預覽檔案</button>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(sub.submittedAt).toLocaleString('zh-TW')}
                            </span>
                          </div>
                        ) : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">未繳交</span>}
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
  );
}

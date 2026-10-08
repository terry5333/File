// app/admin/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";

export default function AdminProjectDashboardPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collabName, setCollabName] = useState("");
  const [collabRole, setCollabRole] = useState("導師");
  const router = useRouter(); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "projects", params.projectId));
        if (snap.exists()) setProject(snap.data());
        const subSnap = await getDocs(collection(db, "projects", params.projectId, "submissions"));
        setSubmissions(subSnap.docs.map(d => d.data()));
      } catch (error) {} finally { setLoading(false); }
    };
    fetchData();
  }, [params.projectId]);

  const toggleUploadStatus = async () => {
    const newStatus = project?.isUploadEnabled === false ? true : false;
    setProject({ ...project, isUploadEnabled: newStatus });
    await updateDoc(doc(db, "projects", params.projectId), { isUploadEnabled: newStatus });
  };

  const handleAddCollaborator = async () => {
    if (!collabName.trim()) return;
    const newToken = Math.random().toString(36).substring(2, 10);
    const updated = [...(project.collaborators || []), { name: collabName, role: collabRole, token: newToken }];
    await updateDoc(doc(db, "projects", params.projectId), { collaborators: updated });
    setProject({ ...project, collaborators: updated });
    setCollabName("");
  };

  const handleRemoveCollab = async (token: string) => {
    if(!confirm("確定要刪除嗎？")) return;
    const updated = project.collaborators.filter((c: any) => c.token !== token);
    await updateDoc(doc(db, "projects", params.projectId), { collaborators: updated });
    setProject({ ...project, collaborators: updated });
  };

  const handleReturnFile = async (studentCode: string, reqId: string, fileKey: string) => {
    if (!confirm("確定要退回此檔案嗎？")) return;
    if (fileKey) {
      await fetch("/api/sign/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileKey }) });
    }
    await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${studentCode}_${reqId}`));
    setSubmissions(prev => prev.filter(s => !(s.studentCode === studentCode && s.reqId === reqId)));
  };

  const handleDeleteProject = async () => {
    if (!confirm("確定要徹底刪除專案嗎？")) return;
    const confirmText = prompt(`輸入專案名稱「${project.name}」確認刪除：`);
    if (confirmText !== project.name) return;
    setLoading(true);
    for (const sub of submissions) {
      if (sub.fileKey) await fetch("/api/sign/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileKey: sub.fileKey }) });
      await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${sub.studentCode}_${sub.reqId}`));
    }
    await deleteDoc(doc(db, "projects", params.projectId));
    router.push("/admin"); 
  };

  const handlePreview = async (fileKey: string) => {
    const res = await fetch("/api/sign/read", { method: "POST", body: JSON.stringify({ fileKey }) });
    const data = await res.json();
    window.open(data.url, "_blank");
  };

  const handleDownloadAll = async () => {
    if (submissions.length === 0) return alert("無人繳交");
    const zip = new JSZip();
    for (const sub of submissions) {
      const res = await fetch("/api/sign/read", { method: "POST", body: JSON.stringify({ fileKey: sub.fileKey }) });
      const { url } = await res.json();
      const blob = await (await fetch(url)).blob();
      zip.file(`${sub.studentSeat}_${sub.studentName}/${sub.filename}`, blob);
    }
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${project.name}_全班作業.zip`);
  };

  // 🌟 移除文字
  if (loading) return <div className="min-h-screen bg-slate-50/50"></div>;

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];
  const collaborators = project?.collaborators || [];

  return (
    <div className="space-y-6">
      <div className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/80 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">開放學生上傳</h3>
        </div>
        <button onClick={toggleUploadStatus} className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shadow-inner border border-slate-200/50 ${project?.isUploadEnabled !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}>
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${project?.isUploadEnabled !== false ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <h3 className="text-xl font-bold text-slate-800 mb-6">導師與小老師權限管理</h3>
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input type="text" value={collabName} onChange={e => setCollabName(e.target.value)} placeholder="輸入姓名" className="w-full md:w-auto px-4 py-3 border border-white/80 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 shadow-sm" />
          <div className="flex gap-3 w-full md:w-auto">
            <select value={collabRole} onChange={e => setCollabRole(e.target.value)} className="px-4 py-3 border border-white/80 rounded-xl outline-none bg-white/80 flex-1 font-medium shadow-sm">
              <option value="導師">導師</option>
              <option value="小老師">小老師</option>
            </select>
            <button onClick={handleAddCollaborator} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-md">產生連結</button>
          </div>
        </div>
        <div className="space-y-3">
          {collaborators.map((c: any) => (
            <div key={c.token} className="flex flex-col md:flex-row justify-between p-4 bg-white/50 border border-white/80 rounded-2xl gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm bg-indigo-100 text-indigo-700">{c.role}</span>
                <span className="font-bold text-slate-700 text-lg">{c.name}</span>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${c.token}`)} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold shadow-sm">複製連結</button>
                <button onClick={() => handleRemoveCollab(c.token)} className="flex-1 px-4 py-2 text-red-600 bg-red-50 rounded-xl font-bold">刪除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">全班繳交狀況</h2>
          <button onClick={handleDownloadAll} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md">打包下載</button>
        </div>
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
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md font-bold">✅ 已交</span>
                            <button onClick={() => handlePreview(sub.fileKey)} className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-md">預覽</button>
                            <button onClick={() => handleReturnFile(student.code, req.id, sub.fileKey)} className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md">退回</button>
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

      <div className="bg-red-50/80 p-8 rounded-[2rem] border border-red-200 mt-10">
        <h3 className="text-xl font-bold text-red-700 mb-6">危險區域 (Danger Zone)</h3>
        <button onClick={handleDeleteProject} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl text-sm">徹底刪除此專案</button>
      </div>
    </div>
  );
}

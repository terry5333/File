// app/admin/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Link from "next/link";

export default function AdminProjectDashboardPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 人員管理 State
  const [collabName, setCollabName] = useState("");
  const [collabRole, setCollabRole] = useState("導師");

  useEffect(() => {
    fetchData();
  }, [params.projectId]);

  const fetchData = async () => {
    try {
      const snap = await getDoc(doc(db, "projects", params.projectId));
      if (snap.exists()) setProject(snap.data());
      
      const subSnap = await getDocs(collection(db, "projects", params.projectId, "submissions"));
      setSubmissions(subSnap.docs.map(d => d.data()));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 新增人員
  const handleAddCollaborator = async () => {
    if (!collabName.trim()) return;
    const newToken = Math.random().toString(36).substring(2, 10);
    const newCollab = { name: collabName, role: collabRole, token: newToken };
    const updated = [...(project.collaborators || []), newCollab];
    
    await updateDoc(doc(db, "projects", params.projectId), { collaborators: updated });
    setProject({ ...project, collaborators: updated });
    setCollabName("");
  };

  // 刪除人員
  const handleRemoveCollab = async (token: string) => {
    if(!confirm("確定要刪除此人員權限嗎？")) return;
    const updated = project.collaborators.filter((c: any) => c.token !== token);
    await updateDoc(doc(db, "projects", params.projectId), { collaborators: updated });
    setProject({ ...project, collaborators: updated });
  };

  // 退回檔案
  const handleReturnFile = async (studentCode: string, reqId: string) => {
    if (!confirm("確定要退回此檔案嗎？退回後學生將可以重新上傳。")) return;
    try {
      await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${studentCode}_${reqId}`));
      setSubmissions(prev => prev.filter(s => !(s.studentCode === studentCode && s.reqId === reqId)));
    } catch (error) {
      alert("退回失敗");
    }
  };

  const handlePreview = async (fileKey: string) => {
    const res = await fetch("/api/sign/read", { method: "POST", body: JSON.stringify({ fileKey }) });
    const data = await res.json();
    window.open(data.url, "_blank");
  };

  const handleDownloadAll = async () => { /* 保留原下載邏輯，為節省版面略縮寫，請補上你原本的 JSZip 邏輯 */
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

  if (loading) return <div className="p-12 text-center">載入中...</div>;

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];
  const collaborators = project?.collaborators || [];

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
      
      {/* 區塊 1：人員管理 (導師 / 小老師) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">👥 導師與小老師權限管理</h3>
        <div className="flex gap-3 mb-4">
          <input type="text" value={collabName} onChange={e => setCollabName(e.target.value)} placeholder="輸入姓名" className="px-3 py-2 border rounded-lg" />
          <select value={collabRole} onChange={e => setCollabRole(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="導師">導師</option>
            <option value="小老師">小老師</option>
          </select>
          <button onClick={handleAddCollaborator} className="px-4 py-2 bg-slate-800 text-white rounded-lg">產生專屬連結</button>
        </div>
        
        <div className="space-y-2">
          {collaborators.map((c: any) => (
            <div key={c.token} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span className="font-bold text-slate-700">{c.name}</span> <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{c.role}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${c.token}`);
                    alert("已複製專屬連結！");
                  }} 
                  className="text-xs px-3 py-1.5 bg-white border rounded hover:bg-slate-100">複製連結</button>
                <button onClick={() => handleRemoveCollab(c.token)} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded">刪除</button>
              </div>
            </div>
          ))}
          {collaborators.length === 0 && <p className="text-sm text-slate-400">尚未新增任何人員</p>}
        </div>
      </div>

      {/* 區塊 2：繳交看板 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{project.name} - 繳交狀況</h2>
          <button onClick={handleDownloadAll} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">打包下載全部</button>
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
                              <button onClick={() => handlePreview(sub.fileKey)} className="text-xs text-blue-600 underline">預覽</button>
                              <button onClick={() => handleReturnFile(student.code, req.id)} className="text-xs text-red-500 underline">退回</button>
                            </div>
                            {/* 顯示上傳時間 */}
                            <span className="text-[10px] text-slate-400">
                              {new Date(sub.submittedAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

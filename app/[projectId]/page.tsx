// app/admin/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 新增：用來在刪除後跳轉回首頁

export default function AdminProjectDashboardPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 人員管理 State
  const [collabName, setCollabName] = useState("");
  const [collabRole, setCollabRole] = useState("導師");
  
  const router = useRouter(); // 初始化 router

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

  // 🛑 新增：徹底刪除專案功能
  const handleDeleteProject = async () => {
    if (!confirm("⚠️ 警告：確定要徹底刪除這個專案嗎？\n刪除後，所有的學生名單與繳交紀錄將永久消失，無法復原！")) {
      return;
    }
    
    // 雙重確認機制
    const confirmText = prompt(`請輸入專案名稱「${project.name}」以確認刪除：`);
    if (confirmText !== project.name) {
      alert("專案名稱輸入錯誤，已取消刪除動作。");
      return;
    }

    setLoading(true);
    try {
      // 1. 先刪除所有學生的繳交紀錄 (清除 Subcollections 子集合)
      for (const sub of submissions) {
        await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${sub.studentCode}_${sub.reqId}`));
      }
      
      // 2. 刪除專案主檔案
      await deleteDoc(doc(db, "projects", params.projectId));

      alert("✅ 專案已徹底刪除！");
      router.push("/admin"); // 刪除後將管理員踢回總覽頁面
    } catch (error) {
      console.error("刪除失敗", error);
      alert("刪除失敗，請檢查網路連線後重試。");
      setLoading(false);
    }
  };

  const handlePreview = async (fileKey: string) => {
    const res = await fetch("/api/sign/read", { method: "POST", body: JSON.stringify({ fileKey }) });
    const data = await res.json();
    window.open(data.url, "_blank");
  };

  const handleDownloadAll = async () => {
    if (submissions.length === 0) return alert("目前無人繳交任何檔案");
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

  if (loading) return <div className="p-12 text-center text-slate-500">載入中...</div>;

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];
  const collaborators = project?.collaborators || [];

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-6">
      
      {/* 區塊 1：人員管理 (導師 / 小老師) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">👥 導師與小老師權限管理</h3>
        <div className="flex gap-3 mb-4">
          <input type="text" value={collabName} onChange={e => setCollabName(e.target.value)} placeholder="輸入姓名" className="px-3 py-2 border rounded-lg flex-1 md:flex-none" />
          <select value={collabRole} onChange={e => setCollabRole(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="導師">導師</option>
            <option value="小老師">小老師</option>
          </select>
          <button onClick={handleAddCollaborator} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors">產生專屬連結</button>
        </div>
        
        <div className="space-y-2">
          {collaborators.map((c: any) => (
            <div key={c.token} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
              <div>
                <span className="font-bold text-slate-700">{c.name}</span> <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-2">{c.role}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${c.token}`);
                    alert("已複製專屬連結！");
                  }} 
                  className="text-xs px-3 py-1.5 bg-white border rounded hover:bg-slate-100 font-medium">複製連結</button>
                <button onClick={() => handleRemoveCollab(c.token)} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded font-medium">刪除</button>
              </div>
            </div>
          ))}
          {collaborators.length === 0 && <p className="text-sm text-slate-400">尚未新增任何人員</p>}
        </div>
      </div>

      {/* 區塊 2：繳交看板 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Link href="/admin" className="text-sm text-blue-600 hover:underline mb-1 inline-block">← 返回總覽</Link>
            <h2 className="text-xl font-bold">{project.name} - 繳交狀況</h2>
          </div>
          <button onClick={handleDownloadAll} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all">⬇️ 打包下載全部</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="py-3 px-4 text-slate-500 font-semibold">座號/姓名</th>
                {requirements.map((req: any) => <th key={req.id} className="py-3 px-4 text-slate-500 font-semibold">{req.title}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student: any) => (
                <tr key={student.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700">{student.seat} {student.name}</td>
                  {requirements.map((req: any) => {
                    const sub = submissions.find(s => s.studentCode === student.code && s.reqId === req.id);
                    return (
                      <td key={req.id} className="py-3 px-4">
                        {sub ? (
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">✅ 已交</span>
                              <button onClick={() => handlePreview(sub.fileKey)} className="text-xs text-blue-600 hover:text-blue-800 underline font-medium">預覽</button>
                              <button onClick={() => handleReturnFile(student.code, req.id)} className="text-xs text-red-500 hover:text-red-700 underline font-medium">退回</button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(sub.submittedAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-1 rounded font-medium">未繳交</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🛑 區塊 3：

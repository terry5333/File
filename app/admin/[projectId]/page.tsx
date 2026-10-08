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

  const handleAddCollaborator = async () => {
    if (!collabName.trim()) return;
    const newToken = Math.random().toString(36).substring(2, 10);
    const newCollab = { name: collabName, role: collabRole, token: newToken };
    const updated = [...(project.collaborators || []), newCollab];
    
    await updateDoc(doc(db, "projects", params.projectId), { collaborators: updated });
    setProject({ ...project, collaborators: updated });
    setCollabName("");
  };

  const handleRemoveCollab = async (token: string) => {
    if(!confirm("確定要刪除此人員權限嗎？")) return;
    const updated = project.collaborators.filter((c: any) => c.token !== token);
    await updateDoc(doc(db, "projects", params.projectId), { collaborators: updated });
    setProject({ ...project, collaborators: updated });
  };

  const handleReturnFile = async (studentCode: string, reqId: string) => {
    if (!confirm("確定要退回此檔案嗎？退回後學生將可以重新上傳。")) return;
    try {
      await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${studentCode}_${reqId}`));
      setSubmissions(prev => prev.filter(s => !(s.studentCode === studentCode && s.reqId === reqId)));
    } catch (error) {
      alert("退回失敗");
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm("⚠️ 警告：確定要徹底刪除這個專案嗎？\n刪除後，所有的學生名單與繳交紀錄將永久消失，無法復原！")) return;
    
    const confirmText = prompt(`請輸入專案名稱「${project.name}」以確認刪除：`);
    if (confirmText !== project.name) {
      alert("專案名稱輸入錯誤，已取消刪除動作。");
      return;
    }

    setLoading(true);
    try {
      for (const sub of submissions) {
        await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${sub.studentCode}_${sub.reqId}`));
      }
      await deleteDoc(doc(db, "projects", params.projectId));
      alert("✅ 專案已徹底刪除！");
      router.push("/admin"); 
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

  if (loading) return <div className="p-12 text-center text-slate-500">載入表格中...</div>;

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];
  const collaborators = project?.collaborators || [];

  return (
    <div className="space-y-6"> {/* 取消最外層的邊距，因為 layout 已經包好了 */}
      
      {/* 人員管理 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          導師與小老師權限管理
        </h3>
        
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <input 
            type="text" 
            value={collabName} 
            onChange={e => setCollabName(e.target.value)} 
            placeholder="輸入姓名 (例: 王大明)" 
            className="w-full md:w-auto px-4 py-2.5 border border-slate-200 rounded-xl flex-1 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-slate-50/50" 
          />
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={collabRole} 
              onChange={e => setCollabRole(e.target.value)} 
              className="px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-blue-400 bg-slate-50/50 flex-1 md:flex-none font-medium text-slate-700"
            >
              <option value="導師">導師</option>
              <option value="小老師">小老師</option>
            </select>
            <button onClick={handleAddCollaborator} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors whitespace-nowrap flex-1 md:flex-none">
              產生連結
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {collaborators.map((c: any) => (
            <div key={c.token} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-all">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${c.role === '導師' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>{c.role}</span>
                <span className="font-bold text-slate-700 text-sm">{c.name}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${c.token}`);
                    alert(`已複製 ${c.name} 的連結！`);
                  }} 
                  className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 font-bold text-slate-600"
                >
                  複製連結
                </button>
                <button onClick={() => handleRemoveCollab(c.token)} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg font-bold">刪除</button>
              </div>
            </div>
          ))}
          {collaborators.length === 0 && <p className="text-xs text-slate-400 text-center py-3">尚未新增任何人員</p>}
        </div>
        
        {/* 舊版導師連結相容區塊 */}
        {project?.teacherToken && (
          <div className="mt-4 p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex justify-between items-center gap-4">
            <div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-700 mb-1 inline-block">舊版遺留連結</span>
              <p className="text-xs text-amber-700">此專案保留了舊版的導師連結，您仍可複製使用。</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${project.teacherToken}`);
                alert(`已複製舊版連結！`);
              }} 
              className="text-xs px-3 py-1.5 bg-white border border-amber-200 rounded-lg font-bold text-amber-700 whitespace-nowrap"
            >
              複製舊版
            </button>
          </div>
        )}
      </div>

      {/* 繳交看板 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <h2 className="text-base font-bold text-slate-800">全班繳交狀況</h2>
          <button onClick={handleDownloadAll} className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition-all">
            ⬇️ 打包下載全部
          </button>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4 text-slate-500 font-bold text-xs">座號/姓名</th>
                {requirements.map((req: any) => <th key={req.id} className="py-3 px-4 text-slate-500 font-bold text-xs">{req.title}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student: any) => (
                <tr key={student.code} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700 text-sm">{student.seat} <span className="ml-1">{student.name}</span></td>
                  {requirements.map((req: any) => {
                    const sub = submissions.find(s => s.studentCode === student.code && s.reqId === req.id);
                    return (
                      <td key={req.id} className="py-3 px-4">
                        {sub ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold border border-emerald-100">✅ 已交</span>
                              <button onClick={() => handlePreview(sub.fileKey)} className="text-[11px] text-blue-600 hover:underline font-bold">預覽</button>
                              <button onClick={() => handleReturnFile(student.code, req.id)} className="text-[11px] text-red-500 hover:underline font-bold">退回</button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(sub.submittedAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-bold">未繳交</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 危險區域 */}
      <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 mt-8">
        <h3 className="text-sm font-bold text-red-600 mb-1">危險區域 (Danger Zone)</h3>
        <p className="text-xs text-red-500/80 mb-4 font-medium">刪除後所有名單與繳交紀錄將永久消失，無法復原！</p>
        <button onClick={handleDeleteProject} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all">
          🗑️ 徹底刪除此專案
        </button>
      </div>

    </div>
  );
}

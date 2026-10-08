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

  // 🌟 API路徑已更新：呼叫 /api/sign/delete 退回並刪除 R2 檔案
  const handleReturnFile = async (studentCode: string, reqId: string, fileKey: string) => {
    if (!confirm("確定要退回此檔案嗎？\n退回後，系統將徹底從雲端刪除該檔案，學生需重新上傳。")) return;
    try {
      if (fileKey) {
        await fetch("/api/sign/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey }),
        });
      }
      await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${studentCode}_${reqId}`));
      setSubmissions(prev => prev.filter(s => !(s.studentCode === studentCode && s.reqId === reqId)));
      alert("✅ 檔案已成功退回，並從雲端徹底刪除！");
    } catch (error) {
      alert("退回失敗，請檢查網路連線。");
    }
  };

  // 🌟 API路徑已更新：呼叫 /api/sign/delete 刪除所有 R2 檔案與專案
  const handleDeleteProject = async () => {
    if (!confirm("⚠️ 警告：確定要徹底刪除這個專案嗎？\n刪除後，所有的學生名單、繳交紀錄，以及「雲端上的所有實體檔案」將永久消失，無法復原！")) return;
    
    const confirmText = prompt(`請輸入專案名稱「${project.name}」以確認刪除：`);
    if (confirmText !== project.name) {
      alert("專案名稱輸入錯誤，已取消刪除動作。");
      return;
    }

    setLoading(true);
    try {
      for (const sub of submissions) {
        if (sub.fileKey) {
          await fetch("/api/sign/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileKey: sub.fileKey }),
          });
        }
        await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${sub.studentCode}_${sub.reqId}`));
      }
      await deleteDoc(doc(db, "projects", params.projectId));
      alert("✅ 專案與所有關聯檔案已徹底刪除！空間已釋放。");
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

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">載入表格與資料中...</div>;

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];
  const collaborators = project?.collaborators || [];

  return (
    <div className="space-y-6">
      
      {/* 🌟 人員管理 (恢復玻璃質感) */}
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
          導師與小老師權限管理
        </h3>
        
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input 
            type="text" 
            value={collabName} 
            onChange={e => setCollabName(e.target.value)} 
            placeholder="輸入姓名 (例: 王大明)" 
            className="w-full md:w-auto px-4 py-3 border border-white/80 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 shadow-sm" 
          />
          <div className="flex gap-3 w-full md:w-auto">
            <select 
              value={collabRole} 
              onChange={e => setCollabRole(e.target.value)} 
              className="px-4 py-3 border border-white/80 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 flex-1 md:flex-none font-medium text-slate-700 shadow-sm"
            >
              <option value="導師">導師</option>
              <option value="小老師">小老師</option>
            </select>
            <button onClick={handleAddCollaborator} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors whitespace-nowrap flex-1 md:flex-none shadow-md">
              + 產生專屬連結
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {collaborators.map((c: any) => (
            <div key={c.token} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white/50 border border-white/80 rounded-2xl gap-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg shadow-sm ${c.role === '導師' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{c.role}</span>
                <span className="font-bold text-slate-700 text-lg">{c.name}</span>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${c.token}`);
                    alert(`已複製 ${c.name} 的連結！`);
                  }} 
                  className="flex-1 md:flex-none text-sm px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-700 shadow-sm"
                >
                  📋 複製連結
                </button>
                <button onClick={() => handleRemoveCollab(c.token)} className="flex-1 md:flex-none text-sm px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors">刪除</button>
              </div>
            </div>
          ))}
          {collaborators.length === 0 && <p className="text-sm text-slate-400 text-center py-4 bg-white/30 rounded-xl border border-dashed border-white/80">尚未新增任何小老師或導師</p>}
        </div>
        
        {project?.teacherToken && (
          <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 mb-2 inline-block">舊版遺留連結</span>
              <p className="text-sm text-amber-700 font-medium">此專案保留了舊版的導師連結，您仍可複製使用。</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${project.teacherToken}`);
                alert(`已複製舊版連結！`);
              }} 
              className="w-full md:w-auto text-sm px-4 py-2 bg-white border border-amber-200 rounded-xl hover:bg-amber-100 font-bold text-amber-800 shadow-sm whitespace-nowrap"
            >
              📋 複製舊版連結
            </button>
          </div>
        )}
      </div>

      {/* 🌟 繳交看板 (恢復玻璃質感) */}
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            全班繳交狀況
          </h2>
          <button onClick={handleDownloadAll} className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all">
            ⬇️ 打包下載全部檔案
          </button>
        </div>
        
        <div className="overflow-x-auto rounded-xl border border-white/80 bg-white/40 shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/60 border-b border-white/80">
              <tr>
                <th className="py-4 px-5 text-slate-600 font-bold">座號/姓名</th>
                {requirements.map((req: any) => <th key={req.id} className="py-4 px-5 text-slate-600 font-bold">{req.title}</th>)}
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
                              <button onClick={() => handleReturnFile(student.code, req.id, sub.fileKey)} className="text-xs text-red-500 hover:text-red-700 font-bold border border-red-200 bg-red-50 px-2 py-1 rounded-md transition-colors">退回</button>
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
      </div>

      {/* 🌟 危險區域 (恢復玻璃質感) */}
      <div className="bg-red-50/80 backdrop-blur-xl p-8 rounded-[2rem] border border-red-200 mt-10 shadow-sm">
        <h3 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          危險區域 (Danger Zone)
        </h3>
        <p className="text-sm text-red-600/90 mb-6 font-medium">刪除後所有名單與繳交紀錄，以及雲端上的實體檔案將永久消失，無法復原！</p>
        <button onClick={handleDeleteProject} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition-all">
          🗑️ 徹底刪除此專案
        </button>
      </div>

    </div>
  );
}

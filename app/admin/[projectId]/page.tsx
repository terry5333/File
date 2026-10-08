"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";

export default function AdminProjectDashboardPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]); // 🌟 儲存其他專案清單
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [collabName, setCollabName] = useState("");
  const [collabRole, setCollabRole] = useState("導師");

  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqExt, setNewReqExt] = useState("*");

  const [newStudentSeat, setNewStudentSeat] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [selectedImportProjectId, setSelectedImportProjectId] = useState(""); // 🌟 選中的匯入專案 ID

  const router = useRouter(); 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "projects", params.projectId));
        if (snap.exists()) setProject(snap.data());

        const subSnap = await getDocs(collection(db, "projects", params.projectId, "submissions"));
        setSubmissions(subSnap.docs.map(d => d.data()));

        // 🌟 獲取其他專案清單，用於匯入名單
        const allProjSnap = await getDocs(collection(db, "projects"));
        const pList = allProjSnap.docs.map(d => ({ id: d.id, name: d.data().name })).filter(p => p.id !== params.projectId);
        setAllProjects(pList);
        if (pList.length > 0) setSelectedImportProjectId(pList[0].id);

      } catch (error) {} finally { setLoading(false); }
    };
    fetchData();
  }, [params.projectId]);

  const toggleUploadStatus = async () => {
    const newStatus = project?.isUploadEnabled !== false;
    setProject({ ...project, isUploadEnabled: !newStatus });
    await updateDoc(doc(db, "projects", params.projectId), { isUploadEnabled: !newStatus });
  };

  const handleAddRequirement = async () => {
    if (!newReqTitle.trim()) return alert("請輸入檔案標題");
    const newReq = { id: `req_${Date.now()}`, title: newReqTitle, ext: newReqExt };
    const updated = [...(project.fileRequirements || []), newReq];
    await updateDoc(doc(db, "projects", params.projectId), { fileRequirements: updated });
    setProject({ ...project, fileRequirements: updated });
    setNewReqTitle("");
  };

  const handleRemoveRequirement = async (reqId: string) => {
    if (!confirm("確定要刪除此檔案項目嗎？\n(不影響已上傳檔案)")) return;
    const updated = project.fileRequirements.filter((r: any) => r.id !== reqId);
    await updateDoc(doc(db, "projects", params.projectId), { fileRequirements: updated });
    setProject({ ...project, fileRequirements: updated });
  };

  const handleAddSingleStudent = async () => {
    if (!newStudentSeat.trim() || !newStudentName.trim()) return alert("請填寫座號與姓名");
    const code = Math.random().toString(36).substring(2, 6);
    const updated = [...(project.students || []), { seat: newStudentSeat, name: newStudentName, code }];
    await updateDoc(doc(db, "projects", params.projectId), { students: updated });
    setProject({ ...project, students: updated });
    setNewStudentSeat(""); setNewStudentName("");
    alert("✅ 成功新增學生");
  };

  // 🌟 新功能：從其他專案匯入名單
  const handleImportStudents = async () => {
    if (!selectedImportProjectId) return;
    if (!confirm("確定要從此專案匯入學生名單嗎？")) return;
    
    const snap = await getDoc(doc(db, "projects", selectedImportProjectId));
    if (snap.exists()) {
      const importData = snap.data();
      const importStudents = importData.students || [];
      if (importStudents.length === 0) return alert("該專案目前沒有學生名單！");
      
      // 給予全新的專屬登入代碼
      const newStudents = importStudents.map((s:any) => ({
        seat: s.seat, name: s.name, code: Math.random().toString(36).substring(2, 6)
      }));
      
      const updated = [...(project.students || []), ...newStudents];
      await updateDoc(doc(db, "projects", params.projectId), { students: updated });
      setProject({ ...project, students: updated });
      alert(`✅ 成功從 ${importData.name} 匯入 ${newStudents.length} 位學生！`);
    }
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
    if(!confirm("確定要刪除此權限嗎？")) return;
    const updated = project.collaborators.filter((c: any) => c.token !== token);
    await updateDoc(doc(db, "projects", params.projectId), { collaborators: updated });
    setProject({ ...project, collaborators: updated });
  };

  const handleReturnFile = async (studentCode: string, reqId: string, fileKey: string) => {
    if (!confirm("確定退回檔案並徹底刪除嗎？")) return;
    try {
      if (fileKey) await fetch("/api/sign/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileKey }) });
      await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${studentCode}_${reqId}`));
      setSubmissions(prev => prev.filter(s => !(s.studentCode === studentCode && s.reqId === reqId)));
      alert("✅ 檔案已成功退回");
    } catch (error: any) { alert(`❌ 退回失敗：${error.message}`); }
  };

  const handleDeleteProject = async () => {
    if (!confirm("⚠️ 確定要徹底刪除專案嗎？")) return;
    const confirmText = prompt(`請輸入專案名稱「${project.name}」確認：`);
    if (confirmText !== project.name) return;
    setLoading(true);
    try {
      for (const sub of submissions) {
        if (sub.fileKey) await fetch("/api/sign/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileKey: sub.fileKey }) });
        await deleteDoc(doc(db, "projects", params.projectId, "submissions", `${sub.studentCode}_${sub.reqId}`));
      }
      await deleteDoc(doc(db, "projects", params.projectId));
      router.push("/admin"); 
    } catch (error: any) { alert(`刪除失敗：${error.message}`); setLoading(false); }
  };

  const handlePreview = async (fileKey: string) => {
    const res = await fetch("/api/sign/read", { method: "POST", body: JSON.stringify({ fileKey }) });
    const data = await res.json();
    window.open(data.url, "_blank");
  };

  const handleDownloadAll = async () => {
    if (submissions.length === 0) return alert("目前無人繳交");
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

  if (loading) return <div className="min-h-screen bg-slate-50/50"></div>;

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];
  const collaborators = project?.collaborators || [];

  return (
    <div className="space-y-6 pb-20">
      
      <div className="bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/80 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">開放學生上傳</h3>
          <p className="text-xs md:text-sm text-slate-500 mt-1">關閉後，學生端將顯示「上傳功能已關閉」，無法再提交或修改檔案。</p>
        </div>
        <button onClick={toggleUploadStatus} className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors focus:outline-none shadow-inner border border-slate-200/50 ${project?.isUploadEnabled !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}>
          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${project?.isUploadEnabled !== false ? 'translate-x-7' : 'translate-x-1'}`} />
        </button>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <h3 className="text-xl font-bold text-slate-800 mb-6">需要上傳的檔案項目</h3>
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input type="text" value={newReqTitle} onChange={e => setNewReqTitle(e.target.value)} placeholder="新增檔案標題 (例：生活照)" className="w-full md:w-auto px-4 py-3 border border-white/80 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 shadow-sm font-bold" />
          <div className="flex gap-3 w-full md:w-auto">
            <select value={newReqExt} onChange={e => setNewReqExt(e.target.value)} className="px-4 py-3 border border-white/80 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 flex-1 md:flex-none font-medium shadow-sm">
              <option value="*">不限格式 (*)</option>
              <option value="image/*">圖片 (.jpg, .png)</option>
              <option value=".pdf">PDF 檔 (.pdf)</option>
              <option value=".doc,.docx">Word 檔</option>
              <option value=".xls,.xlsx">Excel 檔</option>
              <option value="video/*">影片 (.mp4)</option>
            </select>
            <button onClick={handleAddRequirement} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md whitespace-nowrap">+ 新增項目</button>
          </div>
        </div>
        <div className="space-y-3">
          {requirements.map((req: any) => (
            <div key={req.id} className="flex justify-between items-center p-4 bg-white/50 border border-white/80 rounded-2xl shadow-sm">
              <div><span className="font-bold text-slate-700 text-lg mr-3">{req.title}</span><span className="px-2.5 py-1 text-xs font-mono rounded-lg shadow-sm bg-blue-50 text-blue-700 border border-blue-100">{req.ext}</span></div>
              <button onClick={() => handleRemoveRequirement(req.id)} className="text-sm px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors">刪除</button>
            </div>
          ))}
          {requirements.length === 0 && <p className="text-sm text-slate-400 text-center py-4 bg-white/30 rounded-xl border border-dashed border-white/80">目前尚未設定任何需繳交的檔案</p>}
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <h3 className="text-xl font-bold text-slate-800 mb-6">建立學生名單</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 bg-white/50 border border-white/80 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-700 mb-4">單筆手動新增</h4>
              <div className="space-y-3">
                <input type="text" value={newStudentSeat} onChange={e => setNewStudentSeat(e.target.value)} placeholder="座號 (例: 1)" className="w-full px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                <input type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="姓名 (例: 王大明)" className="w-full px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
              </div>
            </div>
            <button onClick={handleAddSingleStudent} className="w-full py-3 mt-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md">+ 新增學生</button>
          </div>

          {/* 🌟 修改：從其他專案匯入名單 */}
          <div className="p-6 bg-white/50 border border-white/80 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-700 mb-4">從其他專案匯入</h4>
              <div className="space-y-3">
                <select 
                  value={selectedImportProjectId} 
                  onChange={e => setSelectedImportProjectId(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-bold text-slate-600"
                >
                  {allProjects.length === 0 && <option value="">無其他專案可匯入</option>}
                  {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={handleImportStudents} disabled={!selectedImportProjectId} className="w-full py-3 mt-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-md disabled:opacity-50">
              從選定專案匯入名單
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <h3 className="text-xl font-bold text-slate-800 mb-6">導師與小老師權限管理</h3>
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input type="text" value={collabName} onChange={e => setCollabName(e.target.value)} placeholder="輸入姓名 (例: 王大明)" className="w-full md:w-auto px-4 py-3 border border-white/80 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 shadow-sm" />
          <div className="flex gap-3 w-full md:w-auto">
            <select value={collabRole} onChange={e => setCollabRole(e.target.value)} className="px-4 py-3 border border-white/80 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 flex-1 md:flex-none font-medium text-slate-700 shadow-sm">
              <option value="導師">導師</option>
              <option value="小老師">小老師</option>
            </select>
            <button onClick={handleAddCollaborator} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors whitespace-nowrap flex-1 md:flex-none shadow-md">+ 產生專屬連結</button>
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
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${c.token}`); alert(`已複製！`); }} className="flex-1 md:flex-none text-sm px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 shadow-sm">📋 複製連結</button>
                <button onClick={() => handleRemoveCollab(c.token)} className="flex-1 md:flex-none text-sm px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold transition-colors">刪除</button>
              </div>
            </div>
          ))}
          {collaborators.length === 0 && <p className="text-sm text-slate-400 text-center py-4 bg-white/30 rounded-xl border border-dashed border-white/80">尚未新增任何小老師或導師</p>}
        </div>
        {project?.teacherToken && (
          <div className="mt-4 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div><span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800 mb-2 inline-block">舊版遺留連結</span><p className="text-sm text-amber-700 font-medium">此專案保留了舊版的導師連結，您仍可複製使用。</p></div>
            <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/teacher/${params.projectId}?token=${project.teacherToken}`); alert(`已複製舊版連結！`); }} className="w-full md:w-auto text-sm px-4 py-2 bg-white border border-amber-200 rounded-xl hover:bg-amber-100 font-bold text-amber-800 shadow-sm whitespace-nowrap">📋 複製舊版連結</button>
          </div>
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-800">全班繳交狀況</h2>
          <button onClick={handleDownloadAll} className="w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all">⬇️ 打包下載全部檔案</button>
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
                            <span className="text-[11px] text-slate-400 font-mono ml-1">{new Date(sub.submittedAt).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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

      <div className="bg-red-50/80 backdrop-blur-xl p-8 rounded-[2rem] border border-red-200 mt-10 shadow-sm">
        <h3 className="text-xl font-bold text-red-700 mb-2">危險區域 (Danger Zone)</h3>
        <button onClick={handleDeleteProject} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition-all">🗑️ 徹底刪除此專案</button>
      </div>
    </div>
  );
}

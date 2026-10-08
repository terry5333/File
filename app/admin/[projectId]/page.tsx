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

  const [newReqTitle, setNewReqTitle] = useState("");
  const [newReqExt, setNewReqExt] = useState("*");

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
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          需要上傳的檔案項目
        </h3>
        
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input type="text" value={newReqTitle} onChange={e => setNewReqTitle(e.target.value)} placeholder="新增檔案標題 (例：生活照)" className="w-full md:w-auto px-4 py-3 border border-white/80 rounded-xl flex-1 outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 shadow-sm font-bold" />
          <div className="flex gap-3 w-full md:w-auto

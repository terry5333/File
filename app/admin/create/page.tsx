"use client";

import { useState } from "react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProjectPage() {
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allowResubmit, setAllowResubmit] = useState("overwrite");
  const [allowEdit, setAllowEdit] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = projectId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanId) return alert("請輸入有效專案 ID (英數連字號)");
    setLoading(true);

    try {
      const docRef = doc(db, "projects", cleanId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        alert(`❌ 專案 ID「${cleanId}」已存在！`); setLoading(false); return;
      }
      await setDoc(docRef, {
        name: name.trim(),
        startTime: startTime ? new Date(startTime).getTime() : null,
        endTime: endTime ? new Date(endTime).getTime() : null,
        allowResubmit, allowEdit, students: [], fileRequirements: [], collaborators: [], isUploadEnabled: true, createdAt: Date.now()
      });
      alert("🎉 建立成功！請繼續設定檔案需求與學生名單。");
      router.push(`/admin/${cleanId}`);
    } catch { alert("建立失敗"); setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/50 p-4 md:p-8 flex justify-center items-start">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-3xl space-y-6 mt-4">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 rounded-[2rem] shadow-sm flex items-center gap-5">
          <Link href="/admin" className="flex flex-col items-center justify-center w-14 h-14 bg-white/60 border border-white/80 rounded-2xl text-slate-600 hover:bg-white shadow-sm transition-all shrink-0"><span className="text-[10px] font-bold">返回</span></Link>
          <div><h1 className="text-2xl font-bold text-slate-800">建立新專案</h1></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">專案基本資訊</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">專案 ID (做為專屬網址，限英數字)</label>
                <input type="text" required value={projectId} onChange={(e) => setProjectId(e.target.value)} placeholder="例：photo-2026" className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-mono font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">專案名稱</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="例：畢業照片收集" className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-2">開放上傳時間 (選填)</label><input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-5 py-3.5 bg-white/80 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-medium" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">截止上傳時間 (選填)</label><input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-5 py-3.5 bg-white/80 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-medium" /></div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">上傳權限設定</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">重複上傳規則</label>
                <select value={allowResubmit} onChange={(e) => setAllowResubmit(e.target.value)} className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 font-bold">
                  <option value="overwrite">允許重複上傳 (覆蓋舊檔)</option>
                  <option value="keep_both">允許重複上傳 (保留舊檔)</option>
                  <option value="false">禁止重複上傳</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/80 shadow-sm">
                <div><h3 className="text-sm font-bold text-slate-700">允許學生修改/刪除</h3></div>
                <button type="button" onClick={() => setAllowEdit(!allowEdit)} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner border border-slate-200/50 ${allowEdit ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${allowEdit ? 'translate-x-6' : 'translate-x-1'}`} /></button>
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg transition-all disabled:opacity-50">
            {loading ? "建立中..." : "下一步：設定需求與名單 →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// app/admin/create/page.tsx
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
  
  // 權限設定
  const [allowResubmit, setAllowResubmit] = useState("overwrite"); // overwrite 或 keep_both 或 false
  const [allowEdit, setAllowEdit] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 檢查 ID 是否有填寫，且只能包含英數字或連字號
    const cleanId = projectId.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!cleanId) {
      alert("請輸入有效的專案 ID (僅限英數字與連字號)");
      return;
    }

    setLoading(true);

    try {
      // 檢查 ID 是否已經被使用了
      const docRef = doc(db, "projects", cleanId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        alert(`❌ 專案 ID「${cleanId}」已經存在，請換一個！`);
        setLoading(false);
        return;
      }

      // 建立專案
      await setDoc(docRef, {
        name: name.trim(),
        startTime: startTime ? new Date(startTime).getTime() : null,
        endTime: endTime ? new Date(endTime).getTime() : null,
        allowResubmit,   // 重複上傳規則
        allowEdit,       // 是否允許修改檔案
        students: [],    // 預設為空，稍後再加
        fileRequirements: [], // 預設為空，稍後再加
        collaborators: [],
        isUploadEnabled: true,
        createdAt: Date.now()
      });

      alert("🎉 專案基本設定完成！請接著設定學生名單與檔案需求。");
      // 建立完成後，直接跳轉到該專案的管理頁面
      router.push(`/admin/${cleanId}`);
    } catch (error) {
      console.error("建立失敗:", error);
      alert("建立失敗，請重試");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/50 p-4 md:p-8 flex justify-center items-start">
      {/* 漂亮的光暈背景 */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-3xl space-y-6 mt-4">
        
        {/* 頂部橫幅 */}
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] flex items-center gap-5">
          <Link href="/admin" className="flex flex-col items-center justify-center w-14 h-14 bg-white/60 border border-white/80 rounded-2xl text-slate-600 hover:bg-white shadow-sm transition-all shrink-0">
            <svg className="w-6 h-6 mb-0.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            <span className="text-[10px] font-bold">返回</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">建立新專案</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">設定專案的基本資訊與權限。名單將在下一步設定。</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 基本資訊設定區塊 */}
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              專案基本資訊
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">專案 ID (做為網址，請使用英文或數字)</label>
                <input
                  type="text"
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="例如：grad-photo-2026"
                  className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-xl outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">專案名稱</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：302班 畢業紀念冊照片收集"
                  className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-xl outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-slate-800 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">開放上傳時間 (選填)</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-xl outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-slate-600 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">截止上傳時間 (選填)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-xl outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-slate-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* 權限設定區塊 */}
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              學生上傳權限設定
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">重複上傳規則</label>
                <select
                  value={allowResubmit}
                  onChange={(e) => setAllowResubmit(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm text-slate-700 font-bold"
                >
                  <option value="overwrite">允許重複上傳 (直接覆蓋舊檔案)</option>
                  <option value="keep_both">允許重複上傳 (保留舊檔案，另存新檔)</option>
                  <option value="false">禁止重複上傳 (一旦上傳即鎖定)</option>
                </select>
                <p className="text-xs text-slate-500 mt-2 font-medium">決定學生是否能針對同一個項目上傳多次檔案。</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-white/80 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-slate-700">允許學生修改/刪除已上傳檔案</h3>
                  <p className="text-xs text-slate-500 mt-1">若關閉，學生只能上傳，無法在學生端刪除檔案。</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowEdit(!allowEdit)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none shadow-inner border border-slate-200/50 ${allowEdit ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${allowEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white/50 border-t-white rounded-full"></div>
                建立中...
              </span>
            ) : "進入下一步：設定名單與需求 →"}
          </button>
          
        </form>
      </div>
    </div>
  );
}

// app/admin/create/page.tsx
"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allowResubmit, setAllowResubmit] = useState(true); // 新增：是否允許重複繳交
  const [requirements, setRequirements] = useState([{ id: "req_1", title: "", ext: "*" }]);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleAddRequirement = () => {
    setRequirements([...requirements, { id: `req_${Date.now()}`, title: "", ext: "*" }]);
  };

  const handleRequirementChange = (index: number, field: string, value: string) => {
    const updated = [...requirements];
    updated[index] = { ...updated[index], [field]: value };
    setRequirements(updated);
  };

  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim() || !startTime || !endTime) return alert("請填寫完整專案資訊");
    const validReqs = requirements.filter(r => r.title.trim() !== "");
    if (validReqs.length === 0) return alert("請至少設定一個檔案需求");

    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name,
        startTime,
        endTime,
        allowResubmit,
        fileRequirements: validReqs,
        collaborators: [], // 新增：存放導師與小老師名單
        createdAt: Date.now(),
        students: []
      });
      alert("專案建立成功！");
      router.push(`/admin/${docRef.id}`);
    } catch (error: any) {
      alert("建立失敗: " + error.message);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10 flex justify-center">
      <div className="relative z-10 w-full max-w-2xl bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-[2rem] shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">新增專案</h1>
          <Link href="/admin" className="text-sm text-blue-600 font-medium hover:underline">返回總覽</Link>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">專案名稱</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-white/60 border rounded-xl text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">開放上傳時間</label>
              <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-4 py-3 bg-white/60 border rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">截止時間</label>
              <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-4 py-3 bg-white/60 border rounded-xl text-sm" />
            </div>
          </div>

          {/* 新增功能 7, 8：重複繳交開關 */}
          <label className="flex items-center gap-3 p-4 bg-white/50 border rounded-xl cursor-pointer">
            <input type="checkbox" checked={allowResubmit} onChange={e => setAllowResubmit(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
            <div>
              <p className="text-sm font-bold text-slate-800">允許學生在截止前更換檔案</p>
              <p className="text-xs text-slate-500">若關閉，學生上傳成功後將「不可重複繳交」</p>
            </div>
          </label>

          <div className="pt-4 border-t border-white/50">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-semibold text-slate-700">需繳交檔案項目</label>
              <button onClick={handleAddRequirement} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-medium">+ 新增項目</button>
            </div>
            
            <div className="space-y-3">
              {requirements.map((req, index) => (
                <div key={req.id} className="flex gap-2">
                  <input type="text" value={req.title} onChange={(e) => handleRequirementChange(index, "title", e.target.value)} placeholder="檔案名稱" className="flex-1 px-3 py-2 bg-white/60 border rounded-xl text-sm" />
                  <input type="text" value={req.ext} onChange={(e) => handleRequirementChange(index, "ext", e.target.value)} placeholder="副檔名" className="w-24 px-3 py-2 bg-white/60 border rounded-xl text-sm" />
                  {requirements.length > 1 && <button onClick={() => handleRemoveRequirement(index)} className="p-2 text-red-400">✕</button>}
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all">
            {saving ? "建立中..." : "建立專案"}
          </button>
        </div>
      </div>
    </div>
  );
}

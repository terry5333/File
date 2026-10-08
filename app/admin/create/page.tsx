// app/admin/create/page.tsx
"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProjectPage() {
  const [name, setName] = useState("");
  const [reqs, setReqs] = useState([{ id: `req_${Date.now()}`, title: "", ext: "*" }]);
  const [studentsRaw, setStudentsRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const addReq = () => setReqs([...reqs, { id: `req_${Date.now()}`, title: "", ext: "*" }]);
  
  const updateReq = (index: number, field: string, value: string) => {
    const newReqs = [...reqs];
    newReqs[index] = { ...newReqs[index], [field]: value };
    setReqs(newReqs);
  };

  const removeReq = (index: number) => {
    if (reqs.length > 1) setReqs(reqs.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const students = studentsRaw.split("\n").filter(l => l.trim()).map(l => {
        const parts = l.trim().split(/[\s\t]+/);
        return { seat: parts[0], name: parts.slice(1).join(" "), code: Math.random().toString(36).substring(2, 6) };
      });

      await addDoc(collection(db, "projects"), {
        name,
        fileRequirements: reqs,
        students,
        collaborators: [],
        isUploadEnabled: true,
        allowResubmit: true,
        createdAt: Date.now()
      });
      router.push("/admin");
    } catch (error) {
      alert("建立失敗，請重試");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50/50 p-4 md:p-8">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 rounded-[2rem] shadow-sm flex items-center gap-4">
          <Link href="/admin" className="flex flex-col items-center justify-center w-14 h-14 bg-white/60 border border-white/80 rounded-2xl text-slate-600 hover:bg-white shadow-sm transition-all shrink-0">
            <span className="text-sm font-bold">返回</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">建立新專案</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">專案名稱</h2>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="輸入專案名稱" className="w-full px-5 py-3.5 bg-white/80 border border-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 shadow-sm text-slate-800 font-bold" />
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">需要繳交的檔案</h2>
              <button type="button" onClick={addReq} className="px-4 py-2 bg-blue-50 text-blue-600 font-bold text-sm rounded-xl hover:bg-blue-100 transition-colors">+ 新增</button>
            </div>
            
            {reqs.map((req, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-3 p-4 bg-white/50 border border-white/80 rounded-2xl shadow-sm">
                <input type="text" required value={req.title} onChange={(e) => updateReq(index, "title", e.target.value)} placeholder="檔案標題" className="flex-1 px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-bold text-slate-700" />
                <select value={req.ext} onChange={(e) => updateReq(index, "ext", e.target.value)} className="w-full md:w-48 px-4 py-3 bg-white border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 font-bold text-slate-600">
                  <option value="*">不限格式 (*)</option>
                  <option value="image/*">圖片 (.jpg, .png)</option>
                  <option value=".pdf">PDF 檔 (.pdf)</option>
                  <option value=".doc,.docx">Word 檔</option>
                  <option value=".xls,.xlsx">Excel 檔</option>
                  <option value=".ppt,.pptx">PPT 簡報檔</option>
                  <option value="video/*">影片檔 (.mp4)</option>
                  <option value="audio/*">音訊檔 (.mp3)</option>
                </select>
                {reqs.length > 1 && <button type="button" onClick={() => removeReq(index)} className="px-4 py-3 bg-red-50 text-red-500 font-bold rounded-xl hover:bg-red-100 transition-colors">刪除</button>}
              </div>
            ))}
          </div>

          <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">學生名單</h2>
            <textarea required rows={10} value={studentsRaw} onChange={(e) => setStudentsRaw(e.target.value)} placeholder="座號 姓名 (請換行分隔)" className="w-full px-5 py-4 bg-white/80 border border-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-400 shadow-sm font-mono text-sm resize-y" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50">
            建立專案
          </button>
        </form>
      </div>
    </div>
  );
}

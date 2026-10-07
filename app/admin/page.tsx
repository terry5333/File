"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [files, setFiles] = useState([{ id: "file_1", title: "", ext: ".pdf" }]);

  const addFileRequirement = () => {
    setFiles([...files, { id: `file_${Date.now()}`, title: "", ext: ".pdf" }]);
  };

  const updateFile = (index: number, field: string, value: string) => {
    const newFiles = [...files];
    newFiles[index] = { ...newFiles[index], [field]: value };
    setFiles(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return alert("請填寫專案名稱與代碼！");
    
    const validFiles = files.filter(f => f.title.trim() !== "");
    if (validFiles.length === 0) return alert("請至少設定一個需要收取的檔案！");

    setLoading(true);
    try {
      const user = auth?.currentUser;
      const teacherToken = Math.random().toString(36).substring(2, 10);

      const projectData = {
        name,
        slug,
        fileRequirements: validFiles,
        teacherToken,
        adminEmail: user?.email || "unknown",
        createdAt: Date.now(),
      };

      await setDoc(doc(db, "projects", slug), projectData);
      router.push(`/admin/${slug}`);
    } catch (error: any) {
      console.error("建立失敗:", error);
      alert("建立失敗，請確認是否已登入且具有寫入權限。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10 flex justify-center items-start">
      {/* 懸浮背景光暈 */}
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-2xl mt-10">
        <form onSubmit={handleSubmit} className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-[2rem] shadow-[0_8px_40px_0_rgba(31,38,135,0.05)]">
          <div className="flex items-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 bg-white/60 hover:bg-white backdrop-blur-md rounded-xl flex items-center justify-center text-slate-500 shadow-sm transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <h1 className="text-2xl font-bold text-slate-800">建立新專案</h1>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white/30 rounded-2xl border border-white/50 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">專案名稱</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例：網頁設計期末專題"
                  className="w-full px-4 py-3 bg-white/60 border border-white/80 rounded-xl text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">專案代碼 (作為網址 ID，限英數)</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                  placeholder="例：302-final"
                  className="w-full px-4 py-3 bg-white/60 border border-white/80 rounded-xl text-slate-700 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all shadow-sm font-mono"
                />
              </div>
            </div>

            <div className="p-6 bg-white/30 rounded-2xl border border-white/50">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-semibold text-slate-700">檔案收取清單</label>
                <button
                  type="button"
                  onClick={addFileRequirement}
                  className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors"
                >
                  + 新增檔案
                </button>
              </div>
              
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={file.id} className="flex gap-2 items-center bg-white/40 p-2 rounded-xl border border-white/60">
                    <input
                      type="text"
                      required
                      value={file.title}
                      onChange={(e) => updateFile(index, "title", e.target.value)}
                      placeholder="檔案名稱 (例：企劃書 PDF)"
                      className="flex-1 px-3 py-2 bg-white/60 border border-white/80 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <select
                      value={file.ext}
                      onChange={(e) => updateFile(index, "ext", e.target.value)}
                      className="w-24 px-2 py-2 bg-white/60 border border-white/80 rounded-lg text-sm outline-none font-medium text-slate-600"
                    >
                      <option value="*">不限</option>
                      <option value=".pdf">PDF</option>
                      <option value=".docx">DOCX</option>
                      <option value=".pptx">PPTX</option>
                      <option value="image/*">圖片</option>
                    </select>
                    {files.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md text-white font-semibold rounded-xl shadow-[0_8px_20px_0_rgba(37,99,235,0.2)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "建立中..." : "確認建立專案"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 表單狀態
  const [name, setName] = useState("");
  const [slug, setSlug] = useState(""); // 專案 ID
  const [files, setFiles] = useState([{ id: "file_1", title: "", ext: ".pdf" }]);

  // 新增一個檔案需求欄位
  const addFileRequirement = () => {
    setFiles([...files, { id: `file_${Date.now()}`, title: "", ext: ".pdf" }]);
  };

  // 更新檔案需求內容
  const updateFile = (index: number, field: string, value: string) => {
    const newFiles = [...files];
    newFiles[index] = { ...newFiles[index], [field]: value };
    setFiles(newFiles);
  };

  // 移除檔案需求
  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  // 送出建立專案
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return alert("請填寫專案名稱與專案 ID！");
    
    // 過濾掉沒寫標題的檔案需求
    const validFiles = files.filter(f => f.title.trim() !== "");
    if (validFiles.length === 0) return alert("請至少設定一個需要收取的檔案！");

    setLoading(true);
    try {
      const user = auth.currentUser;
      const teacherToken = Math.random().toString(36).substring(2, 10); // 隨機產生導師查看 Token

      const projectData = {
        name,
        slug,
        fileRequirements: validFiles,
        teacherToken,
        adminEmail: user?.email || "unknown",
        createdAt: Date.now(),
      };

      // 寫入 Firestore
      await setDoc(doc(db, "projects", slug), projectData);
      
      alert("專案建立成功！");
      // 導向專案管理頁
      router.push(`/admin/${slug}`);
    } catch (error: any) {
      console.error("建立失敗:", error);
      alert("建立失敗，請確認你的帳號是否已登入，以及 Firestore 規則是否允許寫入。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">新增專案</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 專案基本資訊 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">專案名稱</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: 302 班 網頁設計期末專題"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">專案 ID (網址代碼，只能英文或數字)</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                placeholder="例: 302-final-project"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <hr />

          {/* 檔案收取設定 */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">需要收取的檔案</label>
              <button
                type="button"
                onClick={addFileRequirement}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + 新增檔案欄位
              </button>
            </div>
            
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={file.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      required
                      value={file.title}
                      onChange={(e) => updateFile(index, "title", e.target.value)}
                      placeholder="檔案顯示名稱 (例: 專題企劃書 PDF)"
                      className="w-full px-3 py-2 border rounded-md text-sm outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <select
                      value={file.ext}
                      onChange={(e) => updateFile(index, "ext", e.target.value)}
                      className="w-full px-2 py-2 border rounded-md text-sm outline-none bg-gray-50"
                    >
                      <option value="*">無限制</option>
                      <option value=".pdf">PDF</option>
                      <option value=".docx">DOCX</option>
                      <option value=".pptx">PPTX</option>
                      <option value=".zip">ZIP</option>
                      <option value="image/*">圖片</option>
                    </select>
                  </div>
                  {files.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 px-2 py-2 hover:bg-red-50 rounded"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "建立中..." : "建立專案"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

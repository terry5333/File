// app/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StudentUploadPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [inputCode, setInputCode] = useState("");
  const [matchedStudent, setMatchedStudent] = useState<any>(null);
  const [existingSubmissions, setExistingSubmissions] = useState<any>({}); // 儲存已繳交紀錄
  const [filesData, setFilesData] = useState<any>({});
  
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [isAllCompleted, setIsAllCompleted] = useState(false); 

  useEffect(() => {
    getDoc(doc(db, "projects", params.projectId)).then((snap) => {
      if (snap.exists()) setProject(snap.data());
      setLoading(false);
    });
  }, [params.projectId]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = project?.students?.find((s: any) => s.code === inputCode.trim());
    if (found) {
      setMatchedStudent(found);
      // 登入時，立刻去資料庫抓他過去交過的檔案
      const q = query(collection(db, "projects", params.projectId, "submissions"), where("studentCode", "==", found.code));
      const snap = await getDocs(q);
      const ex: any = {};
      snap.forEach(d => { ex[d.data().reqId] = d.data(); });
      setExistingSubmissions(ex);
    } else {
      alert("找不到此代號！");
    }
  };

  const handleUploadAll = async () => {
    const requirements = project.fileRequirements || [];
    
    // 檢查：如果「沒有舊檔案」也「沒選新檔案」，就是漏交
    const missing = requirements.filter((req: any) => !filesData[req.id] && !existingSubmissions[req.id]);
    if (missing.length > 0) return alert("您還有檔案尚未選擇！");

    const filesToUpload = requirements.filter((req: any) => filesData[req.id]);
    if (filesToUpload.length === 0) return alert("沒有選擇需要更新的新檔案");

    setIsUploadingAll(true);
    for (const req of filesToUpload) {
      const file = filesData[req.id];
      try {
        const res = await fetch("/api/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type, projectId: params.projectId, studentCode: matchedStudent.code, reqId: req.id })
        });
        const apiData = await res.json();
        
        await fetch(apiData.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

        await setDoc(doc(db, "projects", params.projectId, "submissions", `${matchedStudent.code}_${req.id}`), {
          studentCode: matchedStudent.code,
          studentName: matchedStudent.name,
          studentSeat: matchedStudent.seat,
          reqId: req.id,
          fileKey: apiData.fileKey,
          filename: file.name,
          submittedAt: Date.now()
        });
      } catch (e) {
        console.error("上傳失敗", e);
      }
    }
    setIsUploadingAll(false);
    setIsAllCompleted(true);
  };

  if (loading) return <div>載入中...</div>;

  if (isAllCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="p-10 bg-white rounded-3xl text-center shadow-lg">
          <h2 className="text-2xl font-bold text-emerald-600 mb-2">🎉 檔案已成功送出！</h2>
          <p className="text-slate-500">若需再次更換，請重新登入。</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-100 rounded">返回</button>
        </div>
      </div>
    );
  }

  const allowResubmit = project.allowResubmit !== false; // 是否允許重複繳交

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">{project.name}</h1>
        
        {!matchedStudent ? (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <input type="text" value={inputCode} onChange={e => setInputCode(e.target.value)} placeholder="輸入專屬代號" className="w-full px-4 py-3 border rounded-xl" />
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">登入系統</button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-xl text-center font-bold text-blue-800">
              {matchedStudent.seat} 號 - {matchedStudent.name}
            </div>

            {project.fileRequirements.map((req: any) => {
              const existing = existingSubmissions[req.id]; // 抓取這個欄位有沒有舊紀錄
              
              return (
                <div key={req.id} className="p-4 border rounded-xl">
                  <h3 className="font-bold mb-2">{req.title}</h3>
                  
                  {existing ? (
                    <div className="mb-2">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded mr-2">✅ 已於 {new Date(existing.submittedAt).toLocaleDateString()} 繳交</span>
                      {!allowResubmit && <span className="text-xs text-red-500">(不可更換)</span>}
                    </div>
                  ) : null}

                  {(!existing || allowResubmit) ? (
                    <input type="file" onChange={(e) => setFilesData({ ...filesData, [req.id]: e.target.files?.[0] })} className="text-sm" />
                  ) : null}
                </div>
              );
            })}

            <button onClick={handleUploadAll} disabled={isUploadingAll} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">
              {isUploadingAll ? "上傳中..." : "確認送出"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

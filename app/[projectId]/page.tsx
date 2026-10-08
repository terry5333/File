"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StudentUploadPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [matchedStudent, setMatchedStudent] = useState<any>(null);
  const [isIdentityConfirmed, setIsIdentityConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [existingSubmissions, setExistingSubmissions] = useState<any>({}); 
  const [filesData, setFilesData] = useState<{ [reqId: string]: File | null }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [reqId: string]: string }>({});
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [isAllCompleted, setIsAllCompleted] = useState(false); 

  useEffect(() => {
    getDoc(doc(db, "projects", params.projectId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.fileRequirements) data.fileRequirements = data.fileRequirements.map((req: any, idx: number) => ({ ...req, id: req.id || `req_legacy_${idx}` }));
        setProject(data);
      }
      setLoading(false);
    });
  }, [params.projectId]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg("");
    const now = new Date();
    if (project?.startTime && now < new Date(project.startTime)) return setErrorMsg(`尚未開放上傳。\n開放時間：${new Date(project.startTime).toLocaleString()}`);
    if (project?.endTime && now > new Date(project.endTime)) return setErrorMsg(`已截止上傳。\n截止時間：${new Date(project.endTime).toLocaleString()}`);
    
    const found = project?.students?.find((s: any) => s.code === inputCode.trim());
    if (found) {
      setMatchedStudent(found); setIsIdentityConfirmed(false);
      const snap = await getDocs(query(collection(db, "projects", params.projectId, "submissions"), where("studentCode", "==", found.code)));
      const ex: any = {}; snap.forEach(d => { ex[d.data().reqId] = d.data(); });
      setExistingSubmissions(ex);
    } else setErrorMsg("找不到此代號");
  };

  const handleFileChange = (reqId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFilesData(prev => ({ ...prev, [reqId]: e.target.files![0] }));
      setUploadStatus(prev => ({ ...prev, [reqId]: "selected" }));
    }
  };

  const handleUploadAll = async () => {
    const missing = (project.fileRequirements || []).filter((req: any) => !filesData[req.id] && !existingSubmissions[req.id]);
    if (missing.length > 0) return alert(`您還有檔案尚未選擇！`);

    const filesToUpload = (project.fileRequirements || []).filter((req: any) => filesData[req.id]);
    if (filesToUpload.length === 0) return alert("沒有選擇任何新檔案");

    setIsUploadingAll(true); let hasError = false;

    for (const req of filesToUpload) {
      const file = filesData[req.id]; if (!file) continue;
      setUploadStatus(prev => ({ ...prev, [req.id]: "uploading" }));
      try {
        const urlRes = await fetch("/api/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type, projectId: params.projectId, studentCode: matchedStudent.code, reqId: req.id }) });
        const apiData = await urlRes.json();
        await fetch(apiData.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        await setDoc(doc(db, "projects", params.projectId, "submissions", `${matchedStudent.code}_${req.id}`), { studentCode: matchedStudent.code, studentName: matchedStudent.name, studentSeat: matchedStudent.seat, reqId: req.id, fileKey: apiData.fileKey, filename: file.name, submittedAt: Date.now() });
        setUploadStatus(prev => ({ ...prev, [req.id]: "success" }));
      } catch { setUploadStatus(prev => ({ ...prev, [req.id]: "error" })); hasError = true; }
    }
    setIsUploadingAll(false); if (!hasError) setIsAllCompleted(true);
  };

  if (loading) return <div className="min-h-screen bg-slate-50"></div>;
  if (!project) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">找不到此專案</div>;

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10 flex items-center justify-center">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-[2rem] shadow-sm">
          <div className="text-center mb-8">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-lg">學生繳交專區</span>
            <h1 className="text-2xl font-bold text-slate-800 mt-3">{project.name}</h1>
          </div>

          {project.isUploadEnabled === false ? (
            <div className="p-8 bg-slate-100/80 rounded-2xl text-center"><p className="text-xl font-bold text-slate-800">上傳功能已關閉</p></div>
          ) : !matchedStudent ? (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div><input type="text" required value={inputCode} onChange={(e) => setInputCode(e.target.value)} placeholder="請輸入登入代號" className="w-full px-4 py-3.5 bg-white/60 border border-white/80 rounded-2xl text-center font-mono focus:ring-2 focus:ring-blue-400" /></div>
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm font-bold rounded-xl text-center">{errorMsg}</div>}
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg">登入系統</button>
            </form>
          ) : !isIdentityConfirmed ? (
            <div className="space-y-6">
              <div className="p-8 bg-white/60 rounded-2xl text-center"><p className="text-sm text-slate-500 font-bold mb-1">請確認身分</p><p className="text-2xl font-bold text-slate-800">{matchedStudent.seat} 號 - {matchedStudent.name}</p></div>
              <div className="space-y-3">
                <button onClick={() => setIsIdentityConfirmed(true)} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl">確認無誤，開始繳交</button>
                <button onClick={() => { setMatchedStudent(null); setInputCode(""); }} className="w-full py-3.5 bg-white/60 text-slate-600 font-bold rounded-2xl">不是我，重新輸入</button>
              </div>
            </div>
          ) : isAllCompleted ? (
            <div className="p-10 bg-white/70 rounded-3xl text-center">
              <h2 className="text-2xl font-bold text-slate-800">繳交完成！</h2>
              <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2.5 bg-slate-100 font-bold rounded-xl text-sm">返回首頁</button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-white/50 rounded-2xl">
                <div><p className="text-xs text-slate-400 font-bold">目前身分</p><p className="text-sm font-bold text-slate-700">{matchedStudent.name}</p></div>
                <button onClick={() => { setMatchedStudent(null); setIsIdentityConfirmed(false); }} className="text-xs px-3 py-1.5 bg-slate-200/50 font-bold rounded-lg">登出</button>
              </div>

              <div className="space-y-4">
                {project.fileRequirements?.map((req: any, index: number) => {
                  const existing = existingSubmissions[req.id];
                  return (
                    <div key={index} className="p-4 bg-white/50 rounded-2xl space-y-3">
                      <div className="flex justify-between font-bold text-sm"><span>{req.title}</span><span className="text-xs text-slate-400">格式: {req.ext}</span></div>
                      {existing && <div className="bg-emerald-50 p-2.5 rounded-xl font-bold text-xs text-emerald-700">✅ 之前已繳交</div>}
                      {(!existing || project.allowResubmit !== false) && <input type="file" accept={req.ext === "*" ? "" : req.ext} onChange={(e) => handleFileChange(req.id, e)} disabled={isUploadingAll || uploadStatus[req.id] === "success"} className="w-full text-xs font-bold text-slate-500" />}
                      {uploadStatus[req.id] === "uploading" && <p className="text-xs text-blue-600 font-bold">上傳中...</p>}
                      {uploadStatus[req.id] === "success" && <p className="text-xs text-emerald-600 font-bold">✅ 成功！</p>}
                      {uploadStatus[req.id] === "error" && <p className="text-xs text-red-600 font-bold">❌ 失敗</p>}
                    </div>
                  );
                })}
              </div>
              <button onClick={handleUploadAll} disabled={isUploadingAll} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl disabled:opacity-50">{isUploadingAll ? "處理中..." : "確認送出"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

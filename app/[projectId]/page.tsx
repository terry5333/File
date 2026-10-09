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
  const [isIdentityConfirmed, setIsIdentityConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [existingSubmissions, setExistingSubmissions] = useState<any>({}); 
  const [filesData, setFilesData] = useState<{ [reqId: string]: File | null }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [reqId: string]: string }>({});
  const [errorDetails, setErrorDetails] = useState<{ [reqId: string]: string }>({});
  
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [isAllCompleted, setIsAllCompleted] = useState(false); 

  useEffect(() => {
    getDoc(doc(db, "projects", params.projectId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.fileRequirements) {
          data.fileRequirements = data.fileRequirements.map((req: any, idx: number) => ({
            ...req, id: req.id || `req_legacy_${idx}`
          }));
        }
        setProject(data);
      }
      setLoading(false);
    });
  }, [params.projectId]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const now = new Date();
    if (project?.startTime && now < new Date(project.startTime)) {
      return setErrorMsg(`尚未開放上傳。(開放時間：${new Date(project.startTime).toLocaleString()})`);
    }
    if (project?.endTime && now > new Date(project.endTime)) {
      return setErrorMsg(`已截止上傳。(截止時間：${new Date(project.endTime).toLocaleString()})`);
    }

    const trimmed = inputCode.trim();
    if (!project?.students || project.students.length === 0) {
      return setErrorMsg("此專案尚未設定學生名單，請聯絡老師。");
    }

    const found = project.students.find((s: any) => s.code === trimmed);
    if (found) {
      setMatchedStudent(found);
      setIsIdentityConfirmed(false);
      
      const q = query(collection(db, "projects", params.projectId, "submissions"), where("studentCode", "==", found.code));
      const snap = await getDocs(q);
      const ex: any = {};
      snap.forEach(d => { ex[d.data().reqId] = d.data(); });
      setExistingSubmissions(ex);
    } else {
      setErrorMsg("代號錯誤或不存在，請重新確認。");
    }
  };

  const handleFileChange = (reqId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFilesData(prev => ({ ...prev, [reqId]: e.target.files![0] }));
      setUploadStatus(prev => ({ ...prev, [reqId]: "selected" }));
      setErrorDetails(prev => ({ ...prev, [reqId]: "" }));
    }
  };

  const handleUploadAll = async () => {
    const requirements = project.fileRequirements || [];
    const missing = requirements.filter((req: any) => !filesData[req.id] && !existingSubmissions[req.id]);
    if (missing.length > 0) return alert(`您還有檔案尚未選擇！`);

    const filesToUpload = requirements.filter((req: any) => filesData[req.id]);
    if (filesToUpload.length === 0) return alert("您沒有選擇任何新檔案");

    setIsUploadingAll(true);
    let hasErrorOccurred = false;

    for (const req of filesToUpload) {
      const file = filesData[req.id];
      if (!file) continue;

      setUploadStatus(prev => ({ ...prev, [req.id]: "uploading" }));
      setErrorDetails(prev => ({ ...prev, [req.id]: "" }));

      try {
        const urlRes = await fetch("/api/sign", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type, projectId: params.projectId, studentCode: matchedStudent.code, reqId: req.id }),
        });
        const apiData = await urlRes.json();
        if (!urlRes.ok) throw new Error(apiData.error || "無法取得上傳授權。");

        const uploadRes = await fetch(apiData.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
        if (!uploadRes.ok) throw new Error(`連線拒絕 (狀態碼: ${uploadRes.status})。`);

        await setDoc(doc(db, "projects", params.projectId, "submissions", `${matchedStudent.code}_${req.id}`), {
          studentCode: matchedStudent.code, studentName: matchedStudent.name, studentSeat: matchedStudent.seat, reqId: req.id, fileKey: apiData.fileKey, filename: file.name, submittedAt: Date.now()
        });

        setUploadStatus(prev => ({ ...prev, [req.id]: "success" }));
      } catch (error: any) {
        setUploadStatus(prev => ({ ...prev, [req.id]: "error" }));
        setErrorDetails(prev => ({ ...prev, [req.id]: error.message || "發生未知網路錯誤" }));
        hasErrorOccurred = true;
      }
    }
    
    setIsUploadingAll(false);
    if (!hasErrorOccurred) setIsAllCompleted(true);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
          <div className="animate-spin h-10 w-10 text-blue-500 mb-4 rounded-full border-4 border-white/80 border-t-blue-500 shadow-sm"></div>
          <p className="font-bold text-slate-500 text-lg tracking-wide">系統讀取中...</p>
        </div>
      );
    }

    if (!project) {
      return (
        <div className="text-center py-20 min-h-[300px] flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">找不到此專案</h1>
          <p className="text-sm text-slate-500">請確認老師給的網址是否正確</p>
        </div>
      );
    }

    if (project.isUploadEnabled === false) {
      return (
        <div className="p-8 bg-slate-100/80 border border-slate-200 rounded-3xl text-center shadow-sm min-h-[300px] flex flex-col justify-center items-center">
          <div className="w-16 h-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div>
          <p className="text-xl font-bold text-slate-800 mb-2">上傳功能已關閉</p>
          <p className="text-sm text-slate-500">老師目前已手動暫停此專案的檔案繳交功能。</p>
        </div>
      );
    }

    if (isAllCompleted) {
      return (
        <div className="p-10 bg-white/70 border border-white/80 rounded-3xl text-center shadow-sm space-y-4 min-h-[300px] flex flex-col justify-center items-center">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center shadow-inner"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
          <h2 className="text-2xl font-bold text-slate-800 mt-4">繳交完成！</h2>
          <p className="text-slate-500 text-sm font-medium">您的檔案已成功送出，可以安心關閉此視窗了。</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-3 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all shadow-sm border border-slate-200">返回首頁</button>
        </div>
      );
    }

    if (!matchedStudent) {
      return (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div className="text-center mb-8">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-lg shadow-sm">學生繳交專區</span>
            <h1 className="text-2xl font-bold text-slate-800 mt-3">{project.name}</h1>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 text-center">請輸入您的登入代號</label>
            <input
              type="text"
              required
              value={inputCode}
              onChange={(e) => { setInputCode(e.target.value); setErrorMsg(""); }}
              placeholder="例：a01"
              className="w-full px-5 py-4 bg-white/80 border border-white rounded-2xl text-slate-800 text-center text-xl font-mono tracking-wider outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all"
            />
            {errorMsg && (
              <p className="text-sm text-red-500 font-bold mt-3 text-center animate-pulse">❌ {errorMsg}</p>
            )}
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/20 transition-all">登入系統</button>
        </form>
      );
    }

    if (!isIdentityConfirmed) {
      return (
        <div className="space-y-6">
          <div className="p-8 bg-white/60 border border-white/80 rounded-3xl text-center shadow-sm">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>
            <p className="text-sm text-slate-500 font-bold mb-1">請確認您的身分</p>
            <p className="text-3xl font-bold text-slate-800 tracking-wide">{matchedStudent.seat} 號 - {matchedStudent.name}</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => setIsIdentityConfirmed(true)} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/20 transition-all">確認無誤，開始繳交</button>
            <button onClick={() => { setMatchedStudent(null); setInputCode(""); }} className="w-full py-3.5 bg-white/60 hover:bg-white text-slate-600 font-bold rounded-2xl border border-white/80 shadow-sm transition-all">不是我，重新輸入</button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center p-5 bg-white/60 border border-white/80 rounded-2xl shadow-sm">
          <div><p className="text-xs text-slate-400 font-bold mb-0.5">目前登入身分</p><p className="text-base font-bold text-slate-700">{matchedStudent.seat} 號 - {matchedStudent.name}</p></div>
          <button onClick={() => { setMatchedStudent(null); setIsIdentityConfirmed(false); setInputCode(""); }} className="text-xs px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors shadow-sm">登出</button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700 pl-1">需繳交的檔案項目：</h3>
          {project.fileRequirements?.map((req: any, index: number) => {
            const existing = existingSubmissions[req.id];
            const isLocked = existing && project.allowResubmit === false;

            return (
              <div key={index} className="p-5 bg-white/60 border border-white/80 rounded-2xl space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-base">{req.title}</span>
                  <span className="text-[11px] font-mono bg-white/80 text-slate-500 px-2.5 py-1 rounded-lg border border-white shadow-sm">格式: {req.ext}</span>
                </div>

                {existing && (
                  <div className="bg-emerald-50/80 border border-emerald-100 p-3 rounded-xl flex items-center justify-between shadow-sm">
                    <span className="text-xs font-bold text-emerald-700">✅ 之前已繳交</span>
                    {isLocked && <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-md">不可更換</span>}
                  </div>
                )}

                {!isLocked && (
                  <input type="file" accept={req.ext === "*" ? "" : req.ext} onChange={(e) => handleFileChange(req.id, e)} disabled={isUploadingAll || uploadStatus[req.id] === "success"} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50 transition-colors bg-white/50 border border-white/80 rounded-xl shadow-sm p-1.5" />
                )}

                {uploadStatus[req.id] === "uploading" && <p className="text-xs text-blue-600 font-bold animate-pulse mt-2 flex items-center gap-1">上傳中，請稍候...</p>}
                {uploadStatus[req.id] === "success" && <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">✅ 本次上傳成功！</p>}
                {uploadStatus[req.id] === "error" && (
                  <div className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 shadow-sm"><span className="font-bold block mb-1">❌ 上傳失敗：</span>{errorDetails[req.id] || "請檢查網路連線後重試"}</div>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={handleUploadAll} disabled={isUploadingAll} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex justify-center items-center gap-2">
          {isUploadingAll ? <><div className="animate-spin h-5 w-5 border-2 border-white/50 border-t-white rounded-full"></div> 處理中...</> : "確認送出"}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10 flex items-center justify-center">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 md:p-10 rounded-[3rem] shadow-[0_8px_40px_0_rgba(31,38,135,0.07)] min-h-[400px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// app/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StudentUploadPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState("");
  const [matchedStudent, setMatchedStudent] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // 記錄每個檔案的上傳狀態 (未選擇, 上傳中, 完成, 失敗)
  const [filesData, setFilesData] = useState<{ [reqId: string]: File | null }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [reqId: string]: string }>({});
  const [isUploadingAll, setIsUploadingAll] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "projects", params.projectId)).then((snap) => {
      if (snap.exists()) {
        setProject(snap.data());
      }
      setLoading(false);
    });
  }, [params.projectId]);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const trimmed = inputCode.trim();

    if (!project?.students) {
      setErrorMsg("此專案尚未設定學生名單，請聯絡老師。");
      return;
    }

    const found = project.students.find((s: any) => s.code === trimmed);
    if (found) {
      setMatchedStudent(found);
    } else {
      setErrorMsg("找不到此代號，請再次確認您的代號是否正確。");
    }
  };

  const handleFileChange = (reqId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFilesData(prev => ({ ...prev, [reqId]: selectedFile }));
      setUploadStatus(prev => ({ ...prev, [reqId]: "selected" }));
    }
  };

  const handleUploadAll = async () => {
    const requirements = project.fileRequirements || [];
    const filesToUpload = requirements.filter((req: any) => filesData[req.id]);

    if (filesToUpload.length === 0) {
      alert("請至少選擇一個檔案上傳！");
      return;
    }

    setIsUploadingAll(true);

    for (const req of filesToUpload) {
      const file = filesData[req.id];
      if (!file) continue;

      setUploadStatus(prev => ({ ...prev, [req.id]: "uploading" }));

      try {
        // 1. 取得預先簽名網址 (改用 /api/sign)
        const urlRes = await fetch("/api/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
            projectId: params.projectId,
            studentCode: matchedStudent.code,
            reqId: req.id
          }),
        });
        const { uploadUrl, fileKey } = await urlRes.json();

        // 2. 直接上傳到 R2
        await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        // 3. 寫入繳交紀錄到 Firestore
        const submissionData = {
          studentCode: matchedStudent.code,
          studentName: matchedStudent.name,
          studentSeat: matchedStudent.seat,
          reqId: req.id,
          fileKey: fileKey,
          filename: file.name,
          submittedAt: Date.now()
        };

        await setDoc(
          doc(db, "projects", params.projectId, "submissions", `${matchedStudent.code}_${req.id}`),
          submissionData
        );

        setUploadStatus(prev => ({ ...prev, [req.id]: "success" }));
      } catch (error) {
        console.error("上傳失敗:", error);
        setUploadStatus(prev => ({ ...prev, [req.id]: "error" }));
      }
    }
    
    setIsUploadingAll(false);
    alert("上傳程序執行完畢！");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        載入專案資訊中...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-3xl border border-white/60 text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">找不到此專案</h1>
          <p className="text-sm text-slate-500">請確認網址是否正確</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 p-4 md:p-10 flex items-center justify-center">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 md:p-10 rounded-[2rem] shadow-[0_8px_40px_0_rgba(31,38,135,0.07)]">
          
          <div className="text-center mb-8">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg">學生繳交專區</span>
            <h1 className="text-2xl font-bold text-slate-800 mt-2">{project.name}</h1>
          </div>

          {!matchedStudent ? (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">請輸入您的專屬代號</label>
                <input
                  type="text"
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="例：a01"
                  className="w-full px-4 py-3.5 bg-white/60 border border-white/80 rounded-2xl text-slate-800 text-center text-lg font-mono tracking-wider outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
              >
                確認代號
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-5 bg-blue-50/80 border border-blue-100 rounded-2xl text-center space-y-1">
                <p className="text-xs text-blue-600 font-medium">確認身分：</p>
                <p className="text-xl font-bold text-slate-800">
                  {matchedStudent.seat} 號 - {matchedStudent.name}
                </p>
                <button
                  onClick={() => setMatchedStudent(null)}
                  className="text-xs text-slate-400 hover:text-blue-600 underline mt-2 block mx-auto"
                >
                  不是我？重新輸入代號
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">需繳交的檔案項目：</h3>
                {project.fileRequirements?.map((req: any, index: number) => (
                  <div key={index} className="p-4 bg-white/50 border border-white/70 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                      <span>{req.title}</span>
                      <span className="text-xs text-slate-400 font-mono">格式: {req.ext}</span>
                    </div>
                    
                    <input
                      type="file"
                      accept={req.ext === "*" ? "" : req.ext}
                      onChange={(e) => handleFileChange(req.id, e)}
                      disabled={isUploadingAll || uploadStatus[req.id] === "success"}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
                    />

                    {uploadStatus[req.id] === "uploading" && <p className="text-xs text-blue-600 font-semibold animate-pulse mt-1">上傳中...</p>}
                    {uploadStatus[req.id] === "success" && <p className="text-xs text-emerald-600 font-semibold mt-1">✅ 繳交成功！</p>}
                    {uploadStatus[req.id] === "error" && <p className="text-xs text-red-500 font-semibold mt-1">❌ 上傳失敗，請重試</p>}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploadingAll}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isUploadingAll ? "處理中，請稍候..." : "確認送出所有檔案"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

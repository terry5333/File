// app/admin/[projectId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ProjectDashboardPage({
  params,
}: {
  params: { projectId: string };
}) {
  const [project, setProject] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const snap = await getDoc(doc(db, "projects", params.projectId));
        if (snap.exists()) {
          setProject(snap.data());
          
          // 抓取繳交紀錄
          const subSnap = await getDocs(collection(db, "projects", params.projectId, "submissions"));
          const subs = subSnap.docs.map(d => d.data());
          setSubmissions(subs);
        }
      } catch (error) {
        console.error("載入專案失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [params.projectId]);

  // 切換強制上傳開關
  const handleToggleUpload = async () => {
    setToggling(true);
    const currentStatus = project.isUploadEnabled !== false;
    const newStatus = !currentStatus;

    try {
      await updateDoc(doc(db, "projects", params.projectId), {
        isUploadEnabled: newStatus
      });
      setProject({ ...project, isUploadEnabled: newStatus });
    } catch (error) {
      console.error("切換失敗:", error);
      alert("狀態切換失敗！");
    } finally {
      setToggling(false);
    }
  };

  // 預覽單一檔案
  const handlePreview = async (fileKey: string) => {
    try {
      const res = await fetch("/api/sign/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey })
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank"); // 另開分頁預覽
      } else {
        throw new Error("無法取得網址");
      }
    } catch (error) {
      console.error(error);
      alert("預覽失敗，請重試。");
    }
  };

  // 打包下載所有檔案
  const handleDownloadAll = async () => {
    if (submissions.length === 0) {
      return alert("目前還沒有任何人繳交作業！");
    }

    setDownloadingAll(true);
    try {
      const zip = new JSZip();
      
      // 依序處理每個已繳交的檔案
      for (const sub of submissions) {
        // 1. 取得該檔案的真實 R2 網址
        const res = await fetch("/api/sign/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey: sub.fileKey })
        });
        const { url } = await res.json();

        // 2. 下載檔案內容到瀏覽器記憶體
        const fileRes = await fetch(url);
        const blob = await fileRes.blob();

        // 3. 把檔案塞進 ZIP 裡，並依照「座號_姓名」建立資料夾分類
        const folderName = `${sub.studentSeat}_${sub.studentName}`;
        zip.file(`${folderName}/${sub.filename}`, blob);
      }

      // 4. 產生壓縮檔並觸發下載
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${project.name}_全班作業.zip`);
      
    } catch (error) {
      console.error("打包下載失敗:", error);
      alert("打包下載過程發生錯誤，可能是檔案過大或網路不穩。");
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/45 backdrop-blur-2xl border border-white/60 p-12 rounded-[2rem] text-center text-slate-500 shadow-sm">
        載入中...
      </div>
    );
  }

  const students = project?.students || [];
  const requirements = project?.fileRequirements || [];
  const isEnabled = project?.isUploadEnabled !== false;

  return (
    <div className="bg-white/45 backdrop-blur-2xl border border-white/60 p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">全班檔案繳交狀態</h2>
          <p className="text-sm text-slate-500 mt-1">
            即時監控進度、預覽作業與一鍵打包下載
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* 一鍵打包下載按鈕 */}
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll || submissions.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {downloadingAll ? (
              <span className="animate-pulse">📦 正在壓縮打包中...</span>
            ) : (
              "⬇️ 打包下載全部"
            )}
          </button>

          <div className="flex items-center gap-3 bg-white/60 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
            <span className={`text-sm font-bold ${isEnabled ? "text-emerald-700" : "text-slate-500"}`}>
              {isEnabled ? "🟢 開放上傳中" : "🔴 已關閉上傳"}
            </span>
            <button
              onClick={handleToggleUpload}
              disabled={toggling}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                isEnabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white/30 rounded-2xl border border-white/50 border-dashed">
          <p className="font-medium mb-1">目前尚未建立學生名單</p>
          <p className="text-xs text-slate-400">請先至上方切換到「學生名單管理」分頁新增學生</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-white/60 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">座號</th>
                <th className="py-3 px-4">姓名</th>
                {requirements.map((req: any, idx: number) => (
                  <th key={idx} className="py-3 px-4">{req.title}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40 text-sm">
              {students.map((student: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">{student.seat}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{student.name}</td>
                  {requirements.map((req: any, rIdx: number) => {
                    const submission = submissions.find(
                      s => s.studentCode === student.code && s.reqId === req.id
                    );
                    
                    return (
                      <td key={rIdx} className="py-3.5 px-4">
                        {submission ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg text-xs font-medium">
                              ✅ 已繳交
                            </span>
                            <button
                              onClick={() => handlePreview(submission.fileKey)}
                              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-600 font-semibold text-xs rounded-lg border border-slate-200 shadow-sm transition-colors"
                            >
                              預覽
                            </button>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg text-xs font-medium">
                            未繳交
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

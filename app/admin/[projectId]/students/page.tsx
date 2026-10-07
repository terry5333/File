// app/admin/[projectId]/students/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StudentsManagePage({
  params,
}: {
  params: { projectId: string };
}) {
  const [studentsText, setStudentsText] = useState("");
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 讀取現有學生名單
  useEffect(() => {
    setLoading(true);
    getDoc(doc(db, "projects", params.projectId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.students) {
          setStudentsList(data.students);
          // 將名單轉回文字格式方便編輯
          const text = data.students.map((s: any) => `${s.seat}\t${s.name}`).join("\n");
          setStudentsText(text);
        }
      }
      setLoading(false);
    });
  }, [params.projectId]);

  // 儲存名單
  const handleSave = async () => {
    setSaving(true);
    try {
      // 解析文字：每行格式為「座號 姓名」(可用空白或 Tab 分隔)
      const lines = studentsText.split("\n");
      const parsed = lines
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            return { seat: parts[0], name: parts.slice(1).join(" ") };
          }
          return null;
        })
        .filter(Boolean);

      // 寫入 Firestore 的專案文件內
      await setDoc(
        doc(db, "projects", params.projectId),
        { students: parsed },
        { merge: true }
      );

      setStudentsList(parsed);
      alert("學生名單儲存成功！");
    } catch (error: any) {
      console.error("儲存失敗:", error);
      alert("儲存失敗: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 左側：編輯區 */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
        <h2 className="text-xl font-bold text-slate-800 mb-2">編輯學生名單</h2>
        <p className="text-sm text-slate-500 mb-6">
          請直接貼上或輸入座號與姓名（每行一位，座號與姓名之間用空白或 Tab 隔開）。
        </p>

        <div className="space-y-4">
          <textarea
            rows={12}
            value={studentsText}
            onChange={(e) => setStudentsText(e.target.value)}
            placeholder={"例：\n01 王小明\n02 李小華\n03 張大為"}
            className="w-full p-4 bg-white/60 border border-white/80 rounded-2xl text-slate-700 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {saving ? "儲存中..." : "儲存名單"}
          </button>
        </div>
      </div>

      {/* 右側：預覽區 */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">目前名單預覽</h2>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-lg border border-blue-100">
            共 {studentsList.length} 位學生
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">載入中...</div>
        ) : studentsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white/30 rounded-2xl border border-white/50 border-dashed">
            <p>尚未建立學生名單</p>
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-2">
            {studentsList.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/50 border border-white/70 rounded-xl shadow-sm">
                <span className="font-mono text-xs font-bold bg-slate-200/60 text-slate-600 px-2.5 py-1 rounded-md">
                  {s.seat}
                </span>
                <span className="font-medium text-slate-700 text-sm">{s.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

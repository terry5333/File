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
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getDoc(doc(db, "projects", params.projectId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.students) {
          setStudentsList(data.students);
        }
      }
      setLoading(false);
    });
  }, [params.projectId]);

  // 新增一個空白的學生格子
  const handleAddStudent = () => {
    setStudentsList([...studentsList, { code: "", seat: "", name: "" }]);
  };

  // 更新特定格子的欄位
  const handleStudentChange = (index: number, field: string, value: string) => {
    const updated = [...studentsList];
    updated[index] = { ...updated[index], [field]: value };
    setStudentsList(updated);
  };

  // 刪除特定格子
  const handleRemoveStudent = (index: number) => {
    const updated = studentsList.filter((_, i) => i !== index);
    setStudentsList(updated);
  };

  // 儲存所有學生名單到 Firestore
  const handleSave = async () => {
    setSaving(true);
    try {
      // 過濾掉完全空白的行
      const validStudents = studentsList.filter(
        (s) => s.code.trim() !== "" || s.name.trim() !== ""
      );

      await setDoc(
        doc(db, "projects", params.projectId),
        { students: validStudents },
        { merge: true }
      );

      setStudentsList(validStudents);
      alert("學生名單儲存成功！");
    } catch (error: any) {
      console.error("儲存失敗:", error);
      alert("儲存失敗: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-6 md:p-10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">學生名單管理</h2>
          <p className="text-sm text-slate-500 mt-1">
            以表格格子形式逐一新增學生的代號、座號與姓名。
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAddStudent}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm rounded-xl border border-blue-200 transition-all"
          >
            + 新增學生格子
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {saving ? "儲存中..." : "儲存全部名單"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">載入中...</div>
      ) : studentsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-white/30 rounded-2xl border border-white/50 border-dashed mb-6">
          <p className="mb-2">目前沒有學生資料</p>
          <button
            onClick={handleAddStudent}
            className="text-sm text-blue-600 font-semibold underline"
          >
            點此新增第一位學生
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-3">登入代號</div>
            <div className="col-span-2">座號</div>
            <div className="col-span-6">學生姓名</div>
            <div className="col-span-1 text-center">操作</div>
          </div>

          {studentsList.map((student, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm items-center"
            >
              <div className="col-span-3">
                <input
                  type="text"
                  value={student.code || ""}
                  onChange={(e) => handleStudentChange(index, "code", e.target.value)}
                  placeholder="代號 (例: a01)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={student.seat || ""}
                  onChange={(e) => handleStudentChange(index, "seat", e.target.value)}
                  placeholder="座號 (例: 01)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="col-span-6">
                <input
                  type="text"
                  value={student.name || ""}
                  onChange={(e) => handleStudentChange(index, "name", e.target.value)}
                  placeholder="學生姓名 (例: 王小明)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <button
                  onClick={() => handleRemoveStudent(index)}
                  className="w-9 h-9 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                  title="刪除此行"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {studentsList.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {saving ? "儲存中..." : "儲存全部名單"}
          </button>
        </div>
      )}
    </div>
  );
}

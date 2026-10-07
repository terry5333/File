// app/admin/[projectId]/students/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StudentsManagePage({
  params,
}: {
  params: { projectId: string };
}) {
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. 讀取目前專案的學生名單
      const currentSnap = await getDoc(doc(db, "projects", params.projectId));
      if (currentSnap.exists()) {
        const data = currentSnap.data();
        if (data.students) {
          setStudentsList(data.students);
        }
      }

      // 2. 讀取所有專案（用來做「從其他專案抓取」的下拉選單）
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projects = querySnapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as any))
        .filter((p) => p.id !== params.projectId && p.students && p.students.length > 0);
      setAllProjects(projects);
    } catch (error) {
      console.error("載入資料失敗:", error);
    } finally {
      setLoading(false);
    }
  };

  // 新增一個空白格子
  const handleAddStudent = () => {
    setStudentsList([...studentsList, { code: "", seat: "", name: "" }]);
  };

  // 更新格子內容
  const handleStudentChange = (index: number, field: string, value: string) => {
    const updated = [...studentsList];
    updated[index] = { ...updated[index], [field]: value };
    setStudentsList(updated);
  };

  // 刪除單個格子
  const handleRemoveStudent = (index: number) => {
    const updated = studentsList.filter((_, i) => i !== index);
    setStudentsList(updated);
  };

  // 從其他專案匯入名單
  const handleImportFromProject = () => {
    if (!selectedSourceId) return alert("請先選擇要匯入的來源專案！");
    const sourceProj = allProjects.find((p) => p.id === selectedSourceId);
    if (sourceProj && sourceProj.students) {
      // 複製一份避免互相影響
      setStudentsList(JSON.parse(JSON.stringify(sourceProj.students)));
      alert(`已成功從「${sourceProj.name}」帶入名單！記得點擊下方的「儲存全部名單」才會正式生效。`);
    }
  };

  // 儲存全部名單
  const handleSave = async () => {
    setSaving(true);
    try {
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
      
      {/* 頂部控制列 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">學生名單管理</h2>
          <p className="text-sm text-slate-500 mt-1">
            以格子形式逐一新增，或從其他專案直接抓取名單。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAddStudent}
            className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm rounded-xl border border-blue-200 transition-all"
          >
            + 新增一位學生
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

      {/* 從其他專案抓取名單區塊 */}
      {allProjects.length > 0 && (
        <div className="mb-8 p-4 bg-white/60 border border-white/80 rounded-2xl flex flex-col md:flex-row items-center gap-3">
          <div className="text-sm font-semibold text-slate-700 whitespace-nowrap">
            📥 從其他專案抓取：
          </div>
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="flex-1 w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">-- 請選擇來源專案 --</option>
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.students.length} 位學生)
              </option>
            ))}
          </select>
          <button
            onClick={handleImportFromProject}
            className="w-full md:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-xl shadow-sm transition-all whitespace-nowrap"
          >
            載入名單
          </button>
        </div>
      )}

      {/* 學生格子列表 */}
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
        <div className="space-y-4 mb-8">
          {studentsList.map((student, index) => (
            <div
              key={index}
              className="p-4 bg-white/60 border border-white/80 rounded-2xl shadow-sm space-y-3"
            >
              {/* 上半部：代號與座號（左右各半） */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">登入代號</label>
                  <input
                    type="text"
                    value={student.code || ""}
                    onChange={(e) => handleStudentChange(index, "code", e.target.value)}
                    placeholder="例: a01"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">座號</label>
                  <input
                    type="text"
                    value={student.seat || ""}
                    onChange={(e) => handleStudentChange(index, "seat", e.target.value)}
                    placeholder="例: 01"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* 下半部：姓名與刪除按鈕（左右各半 / 搭配刪除） */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">學生姓名</label>
                  <input
                    type="text"
                    value={student.name || ""}
                    onChange={(e) => handleStudentChange(index, "name", e.target.value)}
                    placeholder="例: 王小明"
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  onClick={() => handleRemoveStudent(index)}
                  className="h-[42px] px-4 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium text-sm whitespace-nowrap"
                >
                  刪除
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

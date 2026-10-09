// app/admin/[projectId]/students/page.tsx
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function StudentManagementPage({ params }: { params: { projectId: string } }) {
  const [project, setProject] = useState<any>(null);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newStudentSeat, setNewStudentSeat] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [selectedImportProjectId, setSelectedImportProjectId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "projects", params.projectId));
        if (snap.exists()) setProject(snap.data());

        const allProjSnap = await getDocs(collection(db, "projects"));
        const pList = allProjSnap.docs
          .map(d => ({ id: d.id, name: d.data().name }))
          .filter(p => p.id !== params.projectId);
          
        setAllProjects(pList);
        if (pList.length > 0) setSelectedImportProjectId(pList[0].id);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.projectId]);

  const handleAddSingleStudent = async () => {
    if (!newStudentSeat.trim() || !newStudentName.trim()) return alert("請填寫座號與姓名");
    const code = Math.random().toString(36).substring(2, 6);
    const newStudent = { seat: newStudentSeat, name: newStudentName, code };
    const updated = [...(project.students || []), newStudent];
    await updateDoc(doc(db, "projects", params.projectId), { students: updated });
    setProject({ ...project, students: updated });
    setNewStudentSeat(""); setNewStudentName("");
    alert(`✅ 成功新增學生：${newStudentName}`);
  };

  const handleImportStudents = async () => {
    if (!selectedImportProjectId) return;
    if (!confirm("確定要從此專案匯入學生名單嗎？")) return;
    
    const snap = await getDoc(doc(db, "projects", selectedImportProjectId));
    if (snap.exists()) {
      const importData = snap.data();
      const importStudents = importData.students || [];
      if (importStudents.length === 0) return alert("該專案目前沒有學生名單！");
      
      const newStudents = importStudents.map((s:any) => ({
        seat: s.seat, name: s.name, code: Math.random().toString(36).substring(2, 6)
      }));
      
      const updated = [...(project.students || []), ...newStudents];
      await updateDoc(doc(db, "projects", params.projectId), { students: updated });
      setProject({ ...project, students: updated });
      alert(`✅ 成功從 ${importData.name} 匯入 ${newStudents.length} 位學生！`);
    }
  };

  const handleDeleteStudent = async (studentCode: string, studentName: string) => {
    if (!confirm(`確定要刪除學生「${studentName}」嗎？\n(注意：這不會刪除他已上傳的檔案，只會將他從名單移除)`)) return;
    const updated = project.students.filter((s: any) => s.code !== studentCode);
    await updateDoc(doc(db, "projects", params.projectId), { students: updated });
    setProject({ ...project, students: updated });
  };

  if (loading) return <div className="min-h-screen bg-slate-50/50"></div>;

  const students = project?.students || [];

  return (
    <div className="space-y-6 pb-20">
      
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          建立學生名單
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-6 bg-white/50 border border-white/80 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-700 mb-4">單筆手動新增</h4>
              <div className="space-y-3">
                <input type="text" value={newStudentSeat} onChange={e => setNewStudentSeat(e.target.value)} placeholder="座號 (例: 1)" className="w-full px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 bg-white shadow-sm" />
                <input type="text" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="姓名 (例: 王大明)" className="w-full px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 bg-white shadow-sm" />
              </div>
            </div>
            <button onClick={handleAddSingleStudent} className="w-full py-3 mt-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md">+ 新增學生</button>
          </div>

          <div className="p-6 bg-white/50 border border-white/80 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-slate-700 mb-4">從其他專案一鍵匯入</h4>
              <p className="text-xs text-slate-500 mb-3 font-medium">系統會自動為匯入的學生產生全新的登入代號。</p>
              <select 
                value={selectedImportProjectId} 
                onChange={e => setSelectedImportProjectId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-emerald-400 bg-white font-bold text-slate-600 shadow-sm"
              >
                {allProjects.length === 0 && <option value="">無其他專案可匯入</option>}
                {allProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button onClick={handleImportStudents} disabled={!selectedImportProjectId} className="w-full py-3 mt-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-md disabled:opacity-50">
              從選定專案匯入名單
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-sm border border-white/80">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">目前學生名單 ({students.length} 人)</h3>
        </div>
        
        {students.length === 0 ? (
          <div className="text-center py-10 bg-white/30 rounded-xl border border-dashed border-white/80">
            <p className="text-slate-500 font-medium">尚未加入任何學生</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {students.map((student: any) => (
              <div key={student.code} className="flex items-center justify-between p-4 bg-white/50 border border-white/80 rounded-2xl shadow-sm">
                <div>
                  <div className="font-bold text-slate-700 text-lg">{student.seat} <span className="ml-1">{student.name}</span></div>
                  <div className="text-xs font-mono text-slate-400 mt-1">代號: {student.code}</div>
                </div>
                <button onClick={() => handleDeleteStudent(student.code, student.name)} className="text-xs px-3 py-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg font-bold transition-colors">刪除</button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

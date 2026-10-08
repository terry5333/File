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
    if (!confirm(`確定要刪除學生「${studentName}」嗎？\n(注意：這不會刪除他已上傳的檔案，只會將他從名單移除

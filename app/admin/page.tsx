// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 監聽登入狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProjects();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 讀取專案列表
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const projData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projData);
    } catch (error) {
      console.error("Error fetching projects:", error);
      alert("讀取專案失敗，請確認你的 Firebase 安全規則是否允許讀取。");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProjects([]);
  };

  // 尚未登入的畫面
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="p-8 bg-white rounded-xl shadow-lg border text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-2">管理員登入</h1>
          <p className="text-sm text-gray-500 mb-6">302 檔案上傳管理系統</p>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition"
          >
            使用 Google 帳號登入
          </button>
        </div>
      </div>
    );
  }

  // 登入後的畫面 (專案列表)
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">專案管理看板</h1>
            <p className="text-sm text-gray-500">登入者: {user.email}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/admin/create")}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              + 新增專案
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              登出
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12 text-gray-500">載入中...</div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500 mb-4">目前還沒有任何專案</p>
            <button
              onClick={() => router.push("/admin/create")}
              className="text-blue-600 font-medium hover:underline"
            >
              立即建立第一個專案
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-gray-800">{project.name}</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    ID: {project.id}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  <p>需收檔案數：{project.fileRequirements?.length || 0} 個</p>
                  <p>建立日期：{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <Link
                  href={`/admin/${project.id}`}
                  className="block text-center w-full py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded hover:bg-gray-100 transition"
                >
                  進入專案管理
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

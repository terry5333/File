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
  const [sysError, setSysError] = useState("");
  const [debugInfo, setDebugInfo] = useState(""); // 存放環境變數檢查結果
  const router = useRouter();

  useEffect(() => {
    // 檢查環境變數是否成功載入 (為了安全只顯示前5碼)
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "空";
    const domain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "空";
    
    setDebugInfo(
      `API Key 狀態: ${key === "空" || key === "未設定" ? "❌ 沒抓到" : `✅ ${key.substring(0, 5)}...`} \n` +
      `Auth Domain: ${domain}`
    );

    try {
      if (!auth || !auth.onAuthStateChanged) {
        setSysError("Firebase 未成功初始化");
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          fetchProjects();
        } else {
          setLoading(false);
        }
      });
      return () => unsubscribe();
    } catch (error: any) {
      setSysError(error.message);
    }
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const projData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(projData);
    } catch (error: any) {
      setSysError("讀取專案失敗: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setSysError(""); // 清除舊錯誤
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setSysError("登入失敗: " + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setProjects([]);
  };

  // 尚未登入畫面
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="p-8 bg-white rounded-xl shadow-lg border text-center w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-2">管理員登入</h1>
          <p className="text-sm text-gray-500 mb-6">302 檔案上傳管理系統</p>
          
          {/* X光機：顯示環境變數狀態 */}
          <div className="mb-6 p-3 bg-gray-800 text-green-400 text-xs text-left rounded-md font-mono whitespace-pre-wrap break-all">
            {debugInfo || "載入中..."}
          </div>

          {sysError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200 break-words text-left">
              {sysError}
            </div>
          )}

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

  // 登入後的專案列表畫面
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">專案管理看板</h1>
            <p className="text-sm text-gray-500 truncate">登入者: {user.email}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push("/admin/create")} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
              + 新增專案
            </button>
            <button onClick={handleLogout} className="px-4 py-2 bg-white text-gray-700 border text-sm rounded-lg">
              登出
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-12 text-gray-500">載入中...</div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-500 mb-4">目前還沒有任何專案</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="bg-white p-6 rounded-xl border shadow-sm">
                <h2 className="text-lg font-bold">{project.name}</h2>
                <p className="text-sm text-gray-500 mb-4 mt-1">ID: {project.id}</p>
                <Link href={`/admin/${project.id}`} className="block text-center w-full py-2 bg-gray-50 border text-gray-700 text-sm rounded">
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

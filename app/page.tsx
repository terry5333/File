// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-6">
      <div className="fixed top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-blue-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>

      <div className="relative z-10 w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/60 p-10 rounded-[2.5rem] shadow-xl text-center">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">檔案繳交系統</h1>
        <p className="text-sm text-slate-500 mb-8">請選擇您的身分進入系統</p>
        
        <div className="space-y-4">
          <Link href="/admin" className="block w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl transition-all">
            管理員 / 總召 登入
          </Link>
          <p className="text-xs text-slate-400 mt-4">
            * 學生、導師與小老師請透過專屬連結進入
          </p>
        </div>
      </div>
    </div>
  );
}

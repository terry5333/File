// app/admin/[projectId]/page.tsx
"use client";

export default function ProjectDashboardPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] min-h-[400px]">
      <h2 className="text-xl font-bold text-slate-800 mb-6">全班檔案繳交狀態</h2>
      
      {/* 暫時放個漂亮空狀態，之後我們會串接 R2 的資料 */}
      <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white/30 rounded-2xl border border-white/50 border-dashed">
        <svg className="w-12 h-12 mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <p className="font-medium">尚未有學生繳交檔案</p>
        <p className="text-sm mt-1">請先匯入學生名單，並將學生端連結發布給班上</p>
      </div>
    </div>
  );
}

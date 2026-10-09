// app/layout.tsx
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google';

export const metadata = {
  title: "302 檔案上傳系統",
  description: "班級檔案收取與管理平台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <head>
        {/* 我們之前加的 Tailwind 雲端載入 */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        
        {/* 🌟 接入 GA4：會自動讀取環境變數中的 GA ID */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  );
}

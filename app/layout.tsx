// app/layout.tsx
import "./globals.css";

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
        {/* 終極解法：強制從雲端載入 Tailwind，無視所有資料夾錯位問題 */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

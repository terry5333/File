// app/layout.tsx
import "./globals.css"; // 確保這行存在，這是載入 Tailwind 的關鍵

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
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

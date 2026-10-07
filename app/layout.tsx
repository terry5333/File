import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
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
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}

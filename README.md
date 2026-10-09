# File
# 📦 Next.js 高質感校園檔案繳交系統

這是一個專為教育現場打造的「檔案繳交與管理系統」。採用 **Next.js** + **Firebase** + **Cloudflare R2** 打造，擁有極致流暢的「毛玻璃 (Glassmorphism)」高質感介面，並具備完善的權限分流機制。

系統完美切分為「管理員」、「教師/小老師檢視」與「學生上傳」三大端點，讓收集全班作業、畢業照片或活動檔案變得前所未有地輕鬆優雅。

---

## ✨ 核心功能特色

### 👑 1. 管理員端 (`/admin`)
最高權限的後台中心，具備 Google 信箱白名單安全驗證。
*   **專案建立與管理**：可自訂專屬網址 ID、設定開放/截止時間、調整「覆蓋/保留/禁止」等重複上傳規則。
*   **彈性檔案需求**：動態新增需繳交的檔案欄位，並支援**副檔名格式限制**（透過下拉選單選擇 `.pdf`, `image/*` 等）。
*   **學生名單建檔**：支援單筆手動新增，或從「其他歷史專案」一鍵完美匯入學生名單。
*   **多重人員權限分配**：可無限生成帶有專屬姓名的「導師」或「小老師」檢視連結。
*   **檔案審核與一鍵下載**：
    *   視覺化矩陣看板，全班繳交進度一目了然。
    *   一鍵打包下載全班實體檔案 (.zip)。
    *   **雲端同步退回機制**：退回學生檔案時，會同步呼叫 AWS S3 API，將實體檔案從 Cloudflare R2 徹底刪除，絕不佔用無效空間。
*   **緊急總開關**：一鍵暫停/開放學生上傳功能。

### 👨‍🏫 2. 教師 / 小老師檢視端 (`/teacher/[projectId]`)
專為班級導師或協助收件的小老師設計的安全檢視介面。
*   **純檢視保護**：透過專屬 Token 進入，僅能查看繳交矩陣與預覽檔案，**無法**刪除或退回檔案，保護資料安全。
*   **清晰上傳規則**：表格上方清楚標示每個檔案項目的規定副檔名格式。
*   **向下相容機制**：系統同時相容舊版的單一 `teacherToken` 與新版多重 `collaborators` 權限系統。

### 🎓 3. 學生上傳端 (`/[projectId]`)
極簡、防呆且具備高質感的繳交體驗。
*   **專屬代號登入**：輸入代碼後，進入專屬的「身分確認」畫面，防止代交或傳錯人。
*   **時間與狀態防護**：若不在開放時間內，或管理員已關閉總開關，介面將自動鎖定並顯示精美提示。
*   **直覺上傳狀態**：
    *   自動過濾不符合副檔名的檔案。
    *   清楚顯示「✅ 之前已繳交」、「不可更換 (若鎖定)」。
    *   所有操作皆有優雅的轉圈與狀態文字提示。

### 🎨 4. 極致 UI/UX 體驗
*   全站採用 **Glassmorphism (毛玻璃)** 設計，搭配柔和的背景光暈。
*   **無縫秒開**：徹底移除傳統突兀的「載入中...」文字，改以流暢的卡片框架與精緻的 Spinner 轉圈動畫取代。
*   RWD 響應式設計，手機、平板、電腦皆有完美體驗。

---

## 🏗️ 技術架構

*   **前端框架**: [Next.js](https://nextjs.org/) (App Router), React, Tailwind CSS
*   **資料庫與驗證**: [Firebase](https://firebase.google.com/) (Firestore, Auth)
*   **檔案雲端儲存**: [Cloudflare R2](https://www.cloudflare.com/zh-tw/developer-platform/r2/) (透過 `@aws-sdk/client-s3` 串接)
*   **檔案處理**: `jszip`, `file-saver`

---

## ⚙️ 環境變數設定

請在專案根目錄建立一個 `.env.local` 檔案（若部署至 Vercel，請於後台 Environment Variables 設定），並填寫以下金鑰：

```env
# Firebase 設定
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"

# Cloudflare R2 設定 (AWS S3 相容 API)
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="your_r2_bucket_name"
```

> **注意**：Firebase API Key 等以 `NEXT_PUBLIC_` 開頭的變數會暴露給前端（這是安全的，受限於 Firebase 規則）。但 Cloudflare R2 的變數**絕對不可**加上 `NEXT_PUBLIC_`，以確保金鑰僅在後端 API (`app/api/...`) 中運行。

---

## 🚀 啟動專案

1. **安裝依賴套件**
   ```bash
   npm install
   # 或 yarn install
   ```

2. **設定管理員白名單**
   請至 `app/admin/layout.tsx` 中，將 `ADMIN_EMAILS` 陣列修改為你自己的 Google 信箱：
   ```typescript
   const ADMIN_EMAILS = ["your_email@gmail.com"];
   ```

3. **啟動本地開發伺服器**
   ```bash
   npm run dev
   # 或 yarn dev
   ```
   伺服器啟動後，請開啟瀏覽器前往 `http://localhost:3000/admin` 開始使用系統。

---

## 💡 部署建議 (Vercel)

本專案完美契合 Vercel 部署環境：
1. 將程式碼推送到 GitHub。
2. 在 Vercel 匯入該 Repository。
3. 在 Vercel 的 Settings > Environment Variables 中，將 `.env.local` 內的所有變數逐一貼上。
4. 點擊 Deploy 即可完成上線。
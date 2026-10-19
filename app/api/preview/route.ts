// app/api/preview/route.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileKey = searchParams.get("fileKey");

  if (!fileKey) return new NextResponse("缺少檔案 Key", { status: 400 });

  // 🌟 支援多種常見的環境變數命名，避免變數為 undefined
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !bucketName) {
    return new NextResponse("伺服器 R2 環境變數未設定完全 (Account ID 或 Bucket Name 缺失)", { status: 500 });
  }

  try {
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
      // 🌟 關鍵：強制路徑樣式，防止預簽章網域組合錯誤
      forcePathStyle: true,
    });

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    // 產生 1 小時有效的安全簽章連結
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // 直接透過伺服器轉址 (302 Redirect)
    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error("預覽連結產生失敗：", error);
    return new NextResponse(`無法產生預覽連結: ${error.message || "未知錯誤"}`, { status: 500 });
  }
}

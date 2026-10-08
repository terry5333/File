// app/api/sign/delete/route.ts
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

// 初始化 S3 客戶端連線至 Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: Request) {
  try {
    const { fileKey } = await req.json();

    if (!fileKey) {
      return NextResponse.json({ error: "缺少檔案 Key" }, { status: 400 });
    }

    // 建立刪除指令
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey, // 檔案在 R2 裡面的唯一路徑/檔名
    });

    // 傳送指令給 R2，徹底刪除實體檔案
    await s3Client.send(command);

    return NextResponse.json({ success: true, message: "實體檔案刪除成功" });
  } catch (error) {
    console.error("R2 刪除檔案失敗:", error);
    return NextResponse.json(
      { error: "無法從 R2 刪除檔案" },
      { status: 500 }
    );
  }
}

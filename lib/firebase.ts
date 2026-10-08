// app/api/sign/delete/route.ts
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileKey } = await req.json();

    if (!fileKey) {
      return NextResponse.json({ error: "缺少檔案 Key，無法刪除" }, { status: 400 });
    }

    // 每次呼叫時才初始化，確保能抓到最新的環境變數
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey, 
    });

    await s3Client.send(command);
    console.log(`✅ 成功從 R2 刪除實體檔案: ${fileKey}`);

    return NextResponse.json({ success: true, message: "實體檔案刪除成功" });
  } catch (error: any) {
    console.error("❌ R2 刪除檔案失敗:", error);
    return NextResponse.json(
      { error: error.message || "無法從 R2 刪除檔案" },
      { status: 500 }
    );
  }
}

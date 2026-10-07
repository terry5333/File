// app/api/upload/sign/route.ts
import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const { projectId, studentCode, fileRequirementId, fileName, contentType } = await req.json();

    if (!projectId || !studentCode || !fileName) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 格式化 R2 存儲路徑: [專案代號]/[學號]/[自訂要求ID]_[原始檔名]
    // 例如: 302-midterm/30201/f1_企劃書.pdf
    const key = `${projectId}/${studentCode}/${fileRequirementId}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || "application/octet-stream",
    });

    // 產生一個 10 分鐘 (600 秒) 後失效的上傳網址
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 600 });

    return NextResponse.json({ uploadUrl, key });
  } catch (err: any) {
    console.error("Sign URL Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

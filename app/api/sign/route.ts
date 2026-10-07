// app/api/sign/route.ts
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(request: Request) {
  try {
    const { filename, contentType, projectId, studentCode, reqId } = await request.json();

    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY ||
      !process.env.R2_BUCKET_NAME
    ) {
      return NextResponse.json({ error: "R2 環境變數未設定完全" }, { status: 500 });
    }

    const S3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    // 檔案路徑設計：專案ID / 學生代號 / 檔案需求ID_原始檔名
    const fileKey = `${projectId}/${studentCode}/${reqId}_${filename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    // 產生一個 5 分鐘內有效的上傳網址
    const signedUrl = await getSignedUrl(S3, command, { expiresIn: 300 });

    return NextResponse.json({
      uploadUrl: signedUrl,
      fileKey: fileKey,
    });
  } catch (error: any) {
    console.error("產生上傳網址錯誤:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

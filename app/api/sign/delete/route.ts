import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { fileKey } = await req.json();
    if (!fileKey) return NextResponse.json({ error: "缺少檔案 Key" }, { status: 400 });

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });

    const command = new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: fileKey });
    await s3Client.send(command);

    return NextResponse.json({ success: true, message: "實體檔案刪除成功" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "無法從 R2 刪除檔案" }, { status: 500 });
  }
}

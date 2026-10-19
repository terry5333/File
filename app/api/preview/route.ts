// app/api/preview/route.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileKey = searchParams.get("fileKey");

  if (!fileKey) return new NextResponse("缺少檔案 Key", { status: 400 });

  try {
    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // 🌟 核心魔法：直接透過伺服器轉址 (302 Redirect)，完美繞過 iOS 阻擋
    return NextResponse.redirect(url);
  } catch (error) {
    return new NextResponse("無法產生預覽連結", { status: 500 });
  }
}

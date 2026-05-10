import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/server/current-user";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

const MAX_BYTES = 300 * 1024; // PRD: thumbnail < 300KB
const ALLOWED_PREFIX = "image/";

function configureCloudinary(): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  return true;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entitlementState = await getCreatorEntitlementsForUser(user.id);
  if (!entitlementState.entitlements.customThumbnailEnabled) {
    return NextResponse.json(
      {
        error: "Upload thumbnail CDN hanya untuk plan yang mendukung custom thumbnail.",
        code: "feature_not_available_for_plan",
      },
      { status: 403 }
    );
  }

  if (!configureCloudinary()) {
    return NextResponse.json(
      {
        error:
          "Upload CDN belum dikonfigurasi. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET — atau isi URL thumbnail manual.",
        code: "cloudinary_not_configured",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Field file wajib berupa gambar." }, { status: 400 });
  }

  if (!file.type.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: "Hanya file gambar yang didukung." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Ukuran maksimal ${MAX_BYTES / 1024}KB (sesuai kebijakan thumbnail).` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "showreels/thumbnails",
          resource_type: "image",
          transformation: [
            { width: 1600, height: 900, crop: "limit" },
            { fetch_format: "auto", quality: "auto" },
          ],
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error("Upload gagal"));
            return;
          }
          resolve(uploadResult);
        }
      );
      stream.end(buffer);
    });

    const url = result.secure_url;
    if (!url) {
      return NextResponse.json({ error: "Upload gagal: tidak ada URL." }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (e) {
    console.error("[upload-thumbnail]", e);
    return NextResponse.json({ error: "Gagal mengunggah ke CDN. Coba lagi." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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

function buildVideoPosterUrl(url: string): string {
  const marker = "/video/upload/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) {
    return "";
  }

  const prefix = url.slice(0, markerIndex + marker.length);
  const assetPath = url.slice(markerIndex + marker.length).replace(/\.[a-z0-9]+(\?.*)?$/i, ".jpg");
  return `${prefix}so_0,w_1280,h_720,c_fill,q_auto,f_jpg/${assetPath}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isAdminEmail(user.email)) {
    return NextResponse.json(
      { error: "Akun owner tidak menggunakan upload portfolio creator." },
      { status: 403 }
    );
  }

  if (!configureCloudinary()) {
    return NextResponse.json(
      {
        error:
          "Upload portfolio belum dikonfigurasi. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET.",
        code: "cloudinary_not_configured",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Field file wajib berupa image atau video." }, { status: 400 });
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Hanya file image atau video yang didukung." }, { status: 400 });
  }

  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / 1024 / 1024);
    return NextResponse.json({ error: `Ukuran file maksimal ${maxMb}MB.` }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = `showreels/portfolio/${user.id}`;
  const resourceType = isVideo ? "video" : "image";

  try {
    const result = await new Promise<{ secure_url?: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          transformation: isImage
            ? [{ width: 1800, height: 1800, crop: "limit" }, { fetch_format: "auto", quality: "auto" }]
            : [{ quality: "auto" }],
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

    return NextResponse.json({
      url,
      mediaType: isVideo ? "video" : "image",
      previewImage: isVideo ? buildVideoPosterUrl(url) : url,
    });
  } catch (error) {
    console.error("[upload-portfolio]", error);
    return NextResponse.json({ error: "Gagal mengunggah portfolio. Coba lagi." }, { status: 500 });
  }
}

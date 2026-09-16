import { v2 as cloudinary } from "cloudinary";

const isCloudinaryConfigured =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadDocument(
  fileBase64: string,
  folder = "going_merry_hms/documents"
): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured) {
    // Return mock document URL for offline / local mode
    const mockId = `mock_doc_${Date.now()}`;
    return {
      url: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
      publicId: mockId,
    };
  }

  const result = await cloudinary.uploader.upload(fileBase64, {
    folder,
    resource_type: "auto",
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export function getSignedDocumentUrl(publicId: string, ttlMinutes = 5): string {
  if (!isCloudinaryConfigured) {
    return `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
  }
  const expiresAt = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
  return cloudinary.utils.private_download_url(publicId, "pdf", {
    expires_at: expiresAt,
  });
}

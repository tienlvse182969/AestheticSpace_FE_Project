import { compressImageFile } from "../utils/imageCompression";

const CLOUD_NAME     = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET  = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

export type CloudinaryResourceType = "image" | "video" | "raw";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: CloudinaryResourceType;
  format: string;
  bytes: number;
  duration?: number; // seconds, for audio/video
  width?: number;
  height?: number;
}

function resolveResourceType(file: File): CloudinaryResourceType {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/") || file.type.startsWith("video/")) return "video";
  return "raw";
}

export async function uploadToCloudinary(
  file: File,
  folder?: string,
  onProgress?: (pct: number) => void,
): Promise<CloudinaryUploadResult> {
  const resourceType = resolveResourceType(file);
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
  const uploadFile = resourceType === "image" ? await compressImageFile(file) : file;

  const body = new FormData();
  body.append("file", uploadFile);
  body.append("upload_preset", UPLOAD_PRESET);
  if (folder) body.append("folder", folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResult);
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err?.error?.message ?? "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("POST", url);
    xhr.send(body);
  });
}

/** Infer asset type from MIME type */
export function mimeToAssetType(file: File): string {
  if (file.type.startsWith("audio/")) return "Audio";
  if (file.type.startsWith("image/")) return "Image";
  if (file.type.startsWith("video/")) return "Video";
  return "Other";
}

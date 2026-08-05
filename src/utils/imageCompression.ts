/**
 * Downscales/re-encodes an oversized image File on the client before upload,
 * so a 20MB/4000px camera photo doesn't get stored and later served at full
 * resolution for a 40px thumbnail. Animated/vector formats are left untouched
 * since canvas re-encoding would destroy animation or rasterize the vector.
 */
const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"]);

export async function compressImageFile(
  file: File,
  maxDimension = 2000,
  quality = 0.85,
): Promise<File> {
  if (!file.type.startsWith("image/") || SKIP_TYPES.has(file.type)) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  if (scale >= 1) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, outType, quality));
  if (!blob || blob.size >= file.size) return file;

  return new File([blob], file.name, { type: outType, lastModified: Date.now() });
}

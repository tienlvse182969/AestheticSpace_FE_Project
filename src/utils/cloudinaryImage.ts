/**
 * Inserts a Cloudinary delivery transformation (auto format/quality + resize)
 * into a Cloudinary URL so the browser downloads and decodes an
 * already-downscaled image instead of the full-resolution original.
 * Non-Cloudinary URLs (placeholders, blob: object URLs, etc.) are returned unchanged.
 */
interface ImageTransformOpts {
  width?: number;
  height?: number;
  /** "fill" crops to exact box (use for objectFit: cover spots), "limit" only downscales, never crops/upscales (use for objectFit: contain / lightboxes). */
  crop?: "fill" | "limit";
}

export function cldOptimize(url: string | null | undefined, opts: ImageTransformOpts): string {
  if (!url) return url ?? "";
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1 || !url.includes("res.cloudinary.com")) return url;

  const { width, height, crop = "fill" } = opts;
  const parts = ["f_auto", "q_auto"];
  if (width) parts.push(`w_${Math.round(width)}`);
  if (height) parts.push(`h_${Math.round(height)}`);
  if (width || height) parts.push(`c_${crop}`);

  return url.slice(0, idx + marker.length) + parts.join(",") + "/" + url.slice(idx + marker.length);
}

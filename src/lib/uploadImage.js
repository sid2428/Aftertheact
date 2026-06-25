import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 5 * 1024 * 1024;

// Saves an uploaded image into public/uploads/<subdir>/ and returns its public path.
// Each file gets a random name, so the URL is content-addressed enough to cache forever.
export async function saveUploadedImage(file, subdir) {
  if (!file || typeof file === "string" || !file.size) return null;

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Unsupported image type. Use JPG, PNG, WEBP, or GIF.");
  if (file.size > MAX_BYTES) throw new Error("Image too large (max 5MB).");

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return `/uploads/${subdir}/${filename}`;
}

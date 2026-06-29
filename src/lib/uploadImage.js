import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

const ALLOWED_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_DIMENSION = 1024; // longest edge after resize

// Sniff the real type from the file's magic bytes — never trust the
// client-supplied MIME / extension (spec P1.2).
function sniffImageType(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  if (buf.length >= 6 && (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a"))
    return "image/gif";
  return null;
}

// Saves an uploaded image into public/uploads/<subdir>/ and returns its public
// path. The image is validated by its header, resized/compressed with sharp,
// and stripped of EXIF metadata before being written. Each file gets a random
// name, so the URL is content-addressed enough to cache forever.
export async function saveUploadedImage(file, subdir) {
  if (!file || typeof file === "string" || !file.size) return null;
  if (file.size > MAX_BYTES) throw new Error("Image too large (max 5MB).");

  const input = Buffer.from(await file.arrayBuffer());

  const detected = sniffImageType(input);
  if (!detected || !ALLOWED_TYPES[detected]) {
    throw new Error("Unsupported or invalid image. Use JPG, PNG, WEBP, or GIF.");
  }
  const ext = ALLOWED_TYPES[detected];

  let output;
  if (detected === "image/gif") {
    // Preserve (possibly animated) GIFs as-is — only the header check applies.
    output = input;
  } else {
    // `.rotate()` bakes in EXIF orientation; sharp then drops all metadata,
    // which strips EXIF (incl. GPS) from the written file.
    const pipeline = sharp(input)
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true });

    if (detected === "image/png") output = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    else if (detected === "image/webp") output = await pipeline.webp({ quality: 82 }).toBuffer();
    else output = await pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  }

  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, filename), output);

  return `/uploads/${subdir}/${filename}`;
}

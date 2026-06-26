import { saveUploadedImage } from "@/lib/uploadImage";

// Build a judge object from admin multipart form data. A newly uploaded `image`
// file is saved and replaces the photo; otherwise the `existing_image` value is
// kept so edits don't wipe the current photo.
export async function judgeFromForm(formData) {
  const imageFile = formData.get("image");
  const existingImage = (formData.get("existing_image") || "").trim();
  const image = imageFile && imageFile.size > 0 ? await saveUploadedImage(imageFile, "judges") : existingImage;

  return {
    name: (formData.get("name") || "").trim(),
    descriptor: (formData.get("descriptor") || "").trim(),
    instagram_handle: (formData.get("instagram") || "").trim(),
    bio: (formData.get("bio") || "").trim(),
    tags: (formData.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean),
    show_in_hero: formData.get("show_in_hero") === "on" || formData.get("show_in_hero") === "true",
    image,
  };
}

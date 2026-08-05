export const UPLOAD_ENDPOINT = "https://upload-file.applicationservice.id/api/upload-file";
export const UPLOAD_HOST = "upload-file.applicationservice.id";

/** Anything above this is rejected before we spend time on the network. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type UploadResponse = {
  status?: number;
  message?: string;
  data?: { filename?: string; url?: string; size?: number };
};

/**
 * Uploads an image to the shared file service and returns its public URL.
 *
 * Stored records hold that URL as a plain string, which is the same shape the
 * UI already handled for data: URLs — so existing rows keep rendering.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File harus berupa gambar.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Gambar terlalu besar (maks ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`);
  }

  const body = new FormData();
  // The service expects the field to be named exactly "file" — anything else
  // comes back as 400 "Unexpected field".
  body.append("file", file);

  let res: Response;
  try {
    // No Content-Type header: the browser must set the multipart boundary.
    res = await fetch(UPLOAD_ENDPOINT, { method: "POST", body });
  } catch {
    throw new Error("Gagal terhubung ke server gambar. Cek koneksi internet.");
  }

  const json: UploadResponse | null = await res.json().catch(() => null);

  if (!res.ok || !json?.data?.url) {
    throw new Error(json?.message || "Gagal mengunggah gambar. Coba lagi.");
  }
  return json.data.url;
}

/** True for both the new hosted URLs and the data: URLs stored previously. */
export function isImageSource(value?: string | null): boolean {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:") || value.startsWith("/");
}

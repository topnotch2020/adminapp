import { api } from "@/lib/api/client";
import { unwrapEnvelope } from "@/lib/api/contracts";

type CloudinaryUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  transformation: string;
};

export const uploadsApi = {
  /** Same signed direct-to-Cloudinary upload the mobile app uses; returns the image URL. */
  async uploadPropertyImage(file: File): Promise<string> {
    const { data } = await api.get<{ data?: CloudinaryUploadSignature }>("/upload/signature");
    const signature = unwrapEnvelope<CloudinaryUploadSignature>(data);

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("folder", signature.folder);
    form.append("transformation", signature.transformation);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      { method: "POST", body: form }
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error?.message || "Image upload failed");
    }
    return result.secure_url as string;
  },
};

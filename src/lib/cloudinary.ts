// src/lib/cloudinary.ts
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  // don't throw here; allow dev to run but warn
  console.warn(
    "Cloudinary env vars not set: CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET"
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a buffer to Cloudinary via upload_stream
 * @param buffer Buffer
 * @param options cloudinary upload options (folder, public_id, resource_type, etc)
 * @returns uploaded resource object
 */
export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: "image" | "video";
  } = {}
) {
  return new Promise<any>((resolve, reject) => {
    const uploadOptions: any = {
      folder: options.folder ?? "queen-beulah",
      resource_type: options.resource_type ?? "image",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };
    if (options.public_id) uploadOptions.public_id = options.public_id;

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

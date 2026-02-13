// src/lib/actions/media.ts
"use server";

import { uploadBufferToCloudinary } from "@/lib/cloudinary";
import { db } from "@/db/server";
import { product_media } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Uploads a single file (File from FormData) to Cloudinary and inserts product_media row
 * @param productId string - Product ID to associate media with
 * @param file File (web File from FormData in Server Action)
 * @param opts optional { position, alt_text }
 */
export async function uploadProductMedia(
  productId: string,
  file: File,
  opts?: { position?: number; alt_text?: string | null }
) {
  // Basic validations
  if (!file) throw new Error("No file provided");
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB for images — adjust or accept larger for videos
  if (file.size > maxSizeBytes) {
    throw new Error("File too large (max 5MB)");
  }

  const mime = file.type || "";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  if (!isImage && !isVideo) {
    throw new Error("Invalid file type. Upload images or short videos.");
  }

  // Enforce product media count <=9

  const existingCountRows = await db
    .select({ cnt: sql`COUNT(*)::int` })
    .from(product_media)
    .where(eq(product_media.product_id, productId));
  const existingCount = Number((existingCountRows as any)[0]?.cnt ?? 0);
  if (existingCount >= 9)
    throw new Error("Maximum media limit (9) reached for this product");

  // Convert file to Buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Cloudinary
  const resourceType = isVideo ? "video" : "image";
  const uploadResult = await uploadBufferToCloudinary(buffer, {
    resource_type: resourceType as any,
  });

  // Upload result contains secure_url, public_id, resource_type, format, width, height, bytes etc
  const url = uploadResult.secure_url ?? uploadResult.url;
  const type = resourceType;

  // Insert into product_media
  const inserted = await db
    .insert(product_media)
    .values({
      product_id: productId,
      url,
      type,
      position: opts?.position ?? existingCount, // append position by default
      alt_text: opts?.alt_text ?? null,
      public_id: uploadResult.public_id ?? null,
    })
    .returning({ id: product_media.id });

  return {
    mediaId: (inserted as any)[0].id,
    url,
    uploadResult,
  };
}

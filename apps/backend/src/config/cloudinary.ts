import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import { env } from "./env.js";

/**
 * Cloudinary client for media uploads
 * Handles avatar uploads, portfolio images/videos
 */

// Configure Cloudinary
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

type CloudinaryCallback = (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => void;

/**
 * Upload image to Cloudinary
 * @param buffer - Image buffer
 * @param folder - Cloudinary folder (e.g., 'avatars', 'portfolios')
 * @param publicId - Optional public ID for the image
 * @returns Cloudinary upload result with URL
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `hustl/${folder}`,
        public_id: publicId,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto:good" },
          { fetch_format: "auto" }
        ]
      },
      ((error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height
        });
      }) as CloudinaryCallback
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload video to Cloudinary
 * @param buffer - Video buffer
 * @param folder - Cloudinary folder
 * @param publicId - Optional public ID
 * @returns Cloudinary upload result with URL
 */
export async function uploadVideo(
  buffer: Buffer,
  folder: string,
  publicId?: string
): Promise<{ url: string; publicId: string; duration: number; format: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `hustl/${folder}`,
        public_id: publicId,
        resource_type: "video",
        transformation: [
          { width: 1080, height: 1920, crop: "limit" },
          { quality: "auto:good" }
        ]
      },
      ((error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error || new Error("Upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration || 0,
          format: result.format
        });
      }) as CloudinaryCallback
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete asset from Cloudinary
 * @param publicId - Cloudinary public ID
 * @param resourceType - 'image' or 'video'
 */
export async function deleteAsset(publicId: string, resourceType: "image" | "video" = "image"): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Generate thumbnail URL for video
 * @param videoPublicId - Video public ID
 * @returns Thumbnail URL
 */
export function getVideoThumbnail(videoPublicId: string): string {
  return cloudinary.url(videoPublicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [
      { width: 400, height: 400, crop: "fill" },
      { quality: "auto:good" }
    ]
  });
}

export { cloudinary };

// Made with Bob

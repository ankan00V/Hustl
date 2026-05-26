import multer from "multer";
import { AppError } from "../utils/app-error.js";

// Configure multer to use memory storage (files stored as Buffer in memory)
const storage = multer.memoryStorage();

// File filter for images
const imageFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      )
    );
  }
};

// File filter for videos
const videoFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        "Invalid file type. Only MP4, MOV, and AVI videos are allowed."
      )
    );
  }
};

// File filter for images and videos
const mediaFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo"
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      AppError.badRequest(
        "Invalid file type. Only images (JPEG, PNG, WebP) and videos (MP4, MOV, AVI) are allowed."
      )
    );
  }
};

// Avatar upload (single image, max 5MB)
export const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single("avatar");

// Portfolio upload (multiple images/videos, max 10MB each)
export const uploadPortfolio = multer({
  storage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 5 // Max 5 files at once
  }
}).array("portfolio", 5);

// Single image upload (generic, max 5MB)
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
}).single("image");

// Single video upload (generic, max 20MB)
export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
}).single("video");

// Made with Bob

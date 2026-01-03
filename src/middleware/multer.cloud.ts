import multer, { FileFilterCallback } from "multer";
import type { Request } from "express";
import { AppErorr } from "../utils";
import { v4 as uuid4 } from "uuid";
import os from "node:os";

export const mediaExtensions = {
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/webp",
    "image/tiff",
    "image/svg+xml",
    "image/heic",
  ],
  video: [
    "video/mp4",
    "video/x-matroska",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/x-flv",
    "video/webm",
    "video/x-m4v",
  ],
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/aac",
    "audio/flac",
    "audio/ogg",
    "audio/mp4",
    "audio/x-ms-wma",
  ],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ],
  archive: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/x-tar",
    "application/gzip",
  ],
  code: [
    "text/javascript",
    "text/typescript",
    "text/jsx",
    "text/tsx",
    "text/html",
    "text/css",
    "application/json",
    "text/x-python",
    "text/x-java-source",
    "text/x-c",
    "text/x-c++",
    "text/x-csharp",
    "application/x-php",
    "text/x-ruby",
  ],
  font: ["font/ttf", "font/otf", "font/woff", "font/woff2"],
};

export enum StoreEnum {
  Disktop = "disctop",
  Cloud = "Cloud",
}

export const multerCloud = ({
  fileType = mediaExtensions.image,
  storeType = StoreEnum.Cloud,
  maxSize = 5,
}: {
  fileType?: string[];
  storeType?: StoreEnum;
  maxSize?: number;
}) => {
  
  const storage =
  storeType === StoreEnum.Cloud
  ? multer.memoryStorage()
  : multer.diskStorage({
    destination: os.tmpdir(),
    
    filename(req: Request, file: Express.Multer.File, cb) {
      cb(null, `${uuid4()}_${file.originalname}`);
    },
  });
  
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (fileType.includes(file.mimetype)) {
      cb(null, true);
    } else {
      return cb(new AppErorr("invaled file type", 400));
    }
  };
  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 * maxSize },
  });
  return upload;
};

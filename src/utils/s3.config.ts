import {
  PutObjectCommand,
  S3Client,
  ObjectCannedACL,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { StoreEnum } from "../middleware";
import { createReadStream } from "node:fs";
import { AppErorr } from "./globelErorr";
import { Upload } from "@aws-sdk/lib-storage";
import { promises } from "node:dns";
import { file, string } from "zod";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3Client = () => {
  return new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
};
interface uplodadingFileType {
  storeType?: StoreEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path: string;
  file: Express.Multer.File;
}
interface uplodadingFilesType {
  storeType?: StoreEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path: string;
  files: Express.Multer.File[];
  forLarge?: boolean;
}
interface uplodadingFilesType {
  storeType?: StoreEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path: string;
  files: Express.Multer.File[];
  forLarge?: boolean;
}
interface oprationAWSType {
  Bucket?: string;
  Key: string;
}

export const uploadFile = async ({
  storeType = StoreEnum.Cloud,
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  path = "general",
  file,
  ACL = "private" as ObjectCannedACL,
}: uplodadingFileType): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket,
    ACL,
    Key: `${process.env.APPLECATION_NAME}/${path}/${uuidv4()}_${
      file.originalname
    }`, //key : path in bucket {socialApp/filename:profileImage/26562326266_uesrProfileImage}
    Body : storeType === StoreEnum.Cloud ? file.buffer : createReadStream(file.path),
    ContentType: file.mimetype,
  });
  if (!command.input.Key) {
    throw new AppErorr("Failed to upload file to s3", 501);
  }

  await s3Client().send(command);

  return command.input.Key;
};

export const uploadLargeFile = async ({
  storeType = StoreEnum.Cloud,
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  path = "general",
  file,
  ACL = "private" as ObjectCannedACL,
}: uplodadingFileType): Promise<string> => {
  const upload = new Upload({
    client: s3Client(),
    params: {
      Bucket,
      ACL,
      Key: `${process.env.APPLECATION_NAME}/${path}/${uuidv4()}_${
        file.originalname
      }`, //key : path in bucket {socialApp/filename:profileImage/26562326266_uesrProfileImage}
      Body:
        storeType === StoreEnum.Cloud
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype,
    },
  });

  upload.on("httpUploadProgress", (progress) => {
    // console.log(progress);
  });

  const { Key } = await upload.done();

  if (!Key) {
    throw new AppErorr("Failed to upload file to s3", 501);
  }
  return Key;
};

export const uploadFiles = async ({
  storeType = StoreEnum.Cloud,
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  path = "general",
  files,
  ACL = "private" as ObjectCannedACL,
  forLarge = false,
}: uplodadingFilesType) => {
  let urls: string[] = [];
  if (forLarge) {
    urls = await Promise.all(files.map((file) => uploadFile({ path, file }))); //for send all files in same moment
  } else {
    urls = await Promise.all(
      files.map((file) => uploadLargeFile({ path, file }))
    ); //for send all files in same moment
  }
  // for (const file of files) {
  //   const key = await uploadFile({
  //     path: `${path}`,
  //     file,
  //   });
  //   urls.push(key)
  // }
  return urls as string[];
};
///// CreatUploadFilePreSignedUrl
export const CreatUploadFilePreSignedUrl = async ({
path,ContentType,originalname,expiresIn=60
}:{
 path:string,
 ContentType?:string,
 originalname?:string,
 expiresIn?:number
 
})=>{
const Key =`${process.env.APPLECATION_NAME}/${path}/${uuidv4()}_${originalname}`
const command = new PutObjectCommand({
  Bucket:process.env.AWS_BUCKET_NAME!,
  Key,
  ContentType
})
const Url = await getSignedUrl(s3Client(),command,{expiresIn})
return{Url,Key}
}

////// get file
export const getFile = async ({
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  Key,
}: oprationAWSType) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });
  return await s3Client().send(command);
};
////// CreatGetFilePreSignUrl file
export const CreatGetFilePreSignUrl = async ({
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  Key,
  expiresIn = 60,
}: oprationAWSType & { expiresIn?: number }) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });
  const url = await getSignedUrl(s3Client(), command, { expiresIn });
  return url;
};
////// CreatDownloadFilePreSignUrl file
export const CreatDownloadFilePreSignUrl = async ({
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  Key,
  expiresIn = 60,
  dowenloadName,
}: oprationAWSType & { expiresIn?: number; dowenloadName?: string }) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition: `attachment; filename="${
      dowenloadName || Key.split("/").pop()
    }"`,
  });
  const url = await getSignedUrl(s3Client(), command, { expiresIn });
  return url;
};

////// delete file
export const deleteOneFile = async ({
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  Key,
}: oprationAWSType) => {
  const command = new DeleteObjectCommand({
    Bucket,
    Key,
  });

  return await s3Client().send(command);
};
//// delete files
export const deleteManyFiles = async ({
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  urls,
  Quiet = false,
}: {
  Bucket?: string;
  urls: string[];
  Quiet?: boolean;
}) => {
  const command = new DeleteObjectsCommand({
    Bucket,
    Delete: {
      Objects: urls.map((url) => ({ Key: url })),
      Quiet,
    },
  });
  return await s3Client().send(command);
};
////// getListOfFiles
export const getListOfFiles = async ({
  Bucket = process?.env?.AWS_BUCKET_NAME! as string,
  path,
}: {
  Bucket?: string;
  path: string;
}) => {
  const command = new ListObjectsV2Command({
    Bucket,
    Prefix: `${process.env.APPLECATION_NAME}/${path}`,
  });

  return await s3Client().send(command);
};

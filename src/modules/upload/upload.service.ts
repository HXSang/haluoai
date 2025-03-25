import { Injectable, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor() {
    this.bucket = process.env.AWS_BUCKET;
    this.cdnUrl = process.env.AWS_URL;
    
    this.s3Client = new S3Client({
      region: process.env.AWS_DEFAULT_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    return {
      fileName,
      originalName: file.originalname,
      path: `/${fileName}`,
      size: file.size,
      mimeType: file.mimetype,
      url: `${this.cdnUrl}/${fileName}`,
    };
  }

  async deleteFile(fileName: string) {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: fileName,
        })
      );
      return { message: 'File deleted successfully' };
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}

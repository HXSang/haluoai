import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    // Create uploads directory if it doesn't exist
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return {
      fileName,
      originalName: file.originalname,
      path: `/uploads/${fileName}`,
      size: file.size,
      mimeType: file.mimetype
    };
  }

  async deleteFile(fileName: string) {
    const filePath = path.join(this.uploadDir, fileName);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      return { message: 'File deleted successfully' };
    } catch (error) {
      throw new NotFoundException('File not found');
    }
  }
}

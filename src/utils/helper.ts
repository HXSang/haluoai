import path from "path";
import * as fs from 'fs';

export const makePaginationResponse = (
  data: any,
  page: number,
  limit: number,
  total: number,
) => {
  return {
    items: data,
    meta: {
      page,
      limit,
      total,
    },
  };
};

// temp: https://api-hailuoai.airing.network/uploads/ce3391e6-fae8-41f6-a4c6-103e39fad6f1.png
export const downloadImage = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();

    // Get content type from response headers
    const contentType = response.headers.get('content-type');
    
    // Determine file extension from mime type
    let extension = '.jpg'; // Default extension
    const mimeToExt: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'image/bmp': '.bmp',
      'image/tiff': '.tiff'
    };
    
    if (contentType && mimeToExt[contentType]) {
      extension = mimeToExt[contentType];
    }

    // Create a unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const tempFilePath = path.join(process.cwd(), `temp-image-${timestamp}-${randomStr}${extension}`);
    
    // Use fs.promises for async file operations
    await fs.promises.writeFile(tempFilePath, Buffer.from(buffer));

    return tempFilePath;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};

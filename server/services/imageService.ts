import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(path.join(process.cwd(), 'public'))) {
  fs.mkdirSync(path.join(process.cwd(), 'public'));
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

/**
 * Convert a base64 string to a file and save it
 * @param base64String - The base64 string to convert
 * @param fileName - Optional filename, will generate one if not provided
 * @returns The URL path to the saved file
 */
export async function saveBase64Image(base64String: string, fileName?: string): Promise<string> {
  try {
    // Remove the data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    
    // Generate a unique filename if one is not provided
    const uniqueFileName = fileName || 
      `${crypto.randomBytes(8).toString('hex')}_${Date.now()}.jpg`;
    
    const filePath = path.join(uploadsDir, uniqueFileName);
    
    // Convert base64 to buffer and save to file
    await fsPromises.writeFile(filePath, base64Data, 'base64');
    
    // Return the public URL path
    return `/uploads/${uniqueFileName}`;
  } catch (error: any) {
    console.error('Error saving base64 image:', error);
    throw new Error(`Failed to save base64 image: ${error.message}`);
  }
}

/**
 * Download an image from a URL and save it locally
 * @param imageUrl - The URL of the image to download
 * @returns The URL path to the saved file
 */
export async function downloadAndSaveImage(imageUrl: string): Promise<string> {
  try {
    console.log(`Downloading image from URL: ${imageUrl}`);
    
    // Generate a unique filename
    const uniqueFileName = `${crypto.randomBytes(8).toString('hex')}_${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    
    // Fetch the image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Get the image data as buffer
    const imageBuffer = await response.buffer();
    
    // Save to file
    await fsPromises.writeFile(filePath, imageBuffer);
    
    // Return the public URL path
    const savedUrl = `/uploads/${uniqueFileName}`;
    console.log(`Image saved to: ${savedUrl}`);
    return savedUrl;
  } catch (error: any) {
    console.error('Error downloading and saving image:', error);
    throw new Error(`Failed to download and save image: ${error.message}`);
  }
}

/**
 * Utility function to check if an image URL is local or remote
 * and ensure it's saved locally
 * @param imageUrl - The image URL to process
 * @returns The local URL path to the image
 */
export async function ensureLocalImage(imageUrl: string): Promise<string> {
  // Check if already a local image
  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }
  
  // Handle base64 images
  if (imageUrl.startsWith('data:image')) {
    return await saveBase64Image(imageUrl);
  }
  
  // Download remote images
  return await downloadAndSaveImage(imageUrl);
}
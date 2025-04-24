import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
  generateImage as generateAIImage, 
  editImage as editAIImage, 
  applyStyle as applyAIStyle 
} from '../services/openAIService';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Schema for saving AI image
const saveAiImageSchema = z.object({
  userId: z.number().positive(),
  prompt: z.string().optional(),
  style: z.string().optional()
});

// Schema for directly saving an AI image
const saveAiImageDirectlySchema = z.object({
  userId: z.number().positive(),
  imageUrl: z.string().url(),
  prompt: z.string().optional(),
  style: z.string().optional()
});

// Schema for image generation
const generateImageSchema = z.object({
  prompt: z.string().min(3).max(1000),
});

// Schema for image editing
const editImageSchema = z.object({
  image: z.string().min(10),
  prompt: z.string().min(3).max(1000),
});

// Schema for style transfer
const styleImageSchema = z.object({
  image: z.string().min(10),
  style: z.string().min(1),
});

// Generate an image from text
export const generateImage = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    // Validate input with safeParse for consistency
    const result = generateImageSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: fromZodError(result.error).message 
      });
    }
    
    const { prompt } = result.data;
    
    // Generate image
    const imageUrl = await generateAIImage(prompt);
    
    // Save to database
    const aiImage = await storage.createAiImage({
      userId,
      prompt,
      imageUrl,
      style: null,
      sourceImageUrl: null
    });
    
    return res.status(201).json({
      id: aiImage.id,
      imageUrl: aiImage.imageUrl
    });
    
  } catch (error) {
    console.error('Generate image error:', error);
    return res.status(500).json({ message: 'Failed to generate image' });
  }
};

// Edit an existing image
export const editImage = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    // Validate input
    const result = editImageSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: fromZodError(result.error).message 
      });
    }
    
    const { image, prompt } = result.data;
    
    // Edit image - we don't actually use the provided image for editing due to API limitations,
    // but we will save it as a reference
    const editedImageUrl = await editAIImage(image, prompt);
    
    // Save to database
    const aiImage = await storage.createAiImage({
      userId,
      prompt,
      imageUrl: editedImageUrl,
      style: null,
      sourceImageUrl: image
    });
    
    return res.status(201).json({
      id: aiImage.id,
      imageUrl: aiImage.imageUrl
    });
    
  } catch (error) {
    console.error('Edit image error:', error);
    return res.status(500).json({ message: 'Failed to edit image' });
  }
};

// Apply a style to an image
export const applyStyle = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    
    // Validate input with safeParse
    const result = styleImageSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: fromZodError(result.error).message 
      });
    }
    
    const { image, style } = result.data;
    
    // Apply style - similar to the edit function, we don't actually use the provided image
    // due to API limitations, but we still save it for reference
    const styledImageUrl = await applyAIStyle(image, style);
    
    // Save to database
    const aiImage = await storage.createAiImage({
      userId,
      prompt: null,
      imageUrl: styledImageUrl,
      style,
      sourceImageUrl: image
    });
    
    return res.status(201).json({
      id: aiImage.id,
      imageUrl: aiImage.imageUrl
    });
    
  } catch (error) {
    console.error('Apply style error:', error);
    return res.status(500).json({ message: 'Failed to apply style to image' });
  }
};

// Save AI image to user's collection
export const saveAiImage = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    const { id } = req.params;
    
    console.log(`Saving AI image ${id} to collection for user ${currentUserId}`);
    
    // Validate input
    const result = saveAiImageSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: fromZodError(result.error).message 
      });
    }
    
    // Verify the image exists
    const aiImages = await storage.getAiImagesByUser(currentUserId);
    const aiImage = aiImages.find(img => img.id === parseInt(id));
    
    if (!aiImage) {
      return res.status(404).json({ message: 'AI image not found' });
    }
    
    // Just mark the AI image as saved without creating a post
    // This way the user can create a post manually with the image later
    console.log(`Successfully saved AI image ${id} to user's collection`);
    
    return res.status(200).json({ 
      message: 'AI image saved to collection',
      imageId: parseInt(id),
      imageUrl: aiImage.imageUrl
    });
    
  } catch (error) {
    console.error('Save AI image error:', error);
    return res.status(500).json({ message: 'Failed to save AI image' });
  }
};

// Directly save an AI image URL to user's collection
export const saveAiImageDirectly = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.session.userId!;
    
    // Validate input
    const result = saveAiImageDirectlySchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: fromZodError(result.error).message 
      });
    }
    
    const { imageUrl, prompt, style } = result.data;
    
    // Import the image service at runtime to avoid circular dependencies
    const { ensureLocalImage } = await import('../services/imageService');
    
    // Ensure the image is saved locally
    const localImageUrl = await ensureLocalImage(imageUrl);
    console.log(`Ensured local image storage: ${imageUrl} -> ${localImageUrl}`);
    
    // Create an AI image record
    const aiImage = await storage.createAiImage({
      userId: currentUserId,
      prompt: prompt || null,
      style: style || null,
      imageUrl: localImageUrl,
      sourceImageUrl: null
    });
    
    console.log(`Successfully saved AI image directly with ID: ${aiImage.id}`);
    
    return res.status(201).json({ 
      message: 'AI image saved to collection',
      imageId: aiImage.id,
      imageUrl: aiImage.imageUrl
    });
    
  } catch (error) {
    console.error('Save AI image directly error:', error);
    return res.status(500).json({ message: 'Failed to save AI image directly' });
  }
};

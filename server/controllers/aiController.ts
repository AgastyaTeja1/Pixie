import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
  generateImage as generateAIImage, 
  editImage as editAIImage, 
  applyStyle as applyAIStyle 
} from '../services/openAIService';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

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

import OpenAI from "openai";

// Make sure to use gpt-4o as it's the latest model
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development'
});

// Mock image URLs for development without API key
const mockImageUrls = [
  'https://images.unsplash.com/photo-1682686581030-7fa4ea2b96c3?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1682687220923-c5b105a59603?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
  'https://images.unsplash.com/photo-1682687221248-3116ba6ab483?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
];

// Generate an image from a text prompt
export async function generateImage(prompt: string): Promise<string> {
  try {
    // Use OpenAI API if key is available
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('dummy')) {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      
      return response.data[0].url;
    } else {
      // Use mock data for development
      console.log('Using mock image data (no API key)');
      const randomIndex = Math.floor(Math.random() * mockImageUrls.length);
      return mockImageUrls[randomIndex];
    }
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image');
  }
}

// Edit an image based on a prompt
export async function editImage(imageBase64: string, prompt: string): Promise<string> {
  try {
    // Use OpenAI API if key is available
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('dummy')) {
      // Real implementation would convert base64 to PNG and use OpenAI API
      // For now, we'll just use the generateImage method as a placeholder
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Edit this image based on: ${prompt}`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      
      return response.data[0].url;
    } else {
      // Use mock data for development
      console.log('Using mock image data (no API key)');
      const randomIndex = Math.floor(Math.random() * mockImageUrls.length);
      return mockImageUrls[randomIndex];
    }
  } catch (error) {
    console.error('Error editing image:', error);
    throw new Error('Failed to edit image');
  }
}

// Apply a style to an image
export async function applyStyle(imageBase64: string, style: string): Promise<string> {
  try {
    // Use OpenAI API if key is available
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('dummy')) {
      // Real implementation would convert base64 to PNG and use OpenAI API
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Transform this image into ${style} style`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      
      return response.data[0].url;
    } else {
      // Use mock data for development
      console.log('Using mock image data (no API key)');
      const randomIndex = Math.floor(Math.random() * mockImageUrls.length);
      return mockImageUrls[randomIndex];
    }
  } catch (error) {
    console.error('Error applying style to image:', error);
    throw new Error('Failed to apply style to image');
  }
}

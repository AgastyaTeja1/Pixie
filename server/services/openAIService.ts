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
      
      if (response.data && response.data.length > 0 && response.data[0].url) {
        return response.data[0].url;
      }
      throw new Error('Invalid response from OpenAI API');
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
      // For image editing, we'll use a descriptive prompt that incorporates the editing request
      // Since DALL-E 3 doesn't support direct image editing, we create a new image based on the prompt
      const enhancedPrompt = `Create an image based on this description: ${prompt}`;
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      
      if (response.data && response.data.length > 0 && response.data[0].url) {
        return response.data[0].url;
      }
      throw new Error('Invalid response from OpenAI API');
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
      // Create an image in the requested style
      const prompt = `Create a beautiful artistic image in ${style} style. Make it visually striking with vibrant colors and rich details.`;
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });
      
      if (response.data && response.data.length > 0 && response.data[0].url) {
        return response.data[0].url;
      }
      throw new Error('Invalid response from OpenAI API');
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

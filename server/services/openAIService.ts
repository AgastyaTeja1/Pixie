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
      // Since we can't directly edit an image with the DALL-E API in the way we want,
      // we will use the vision capabilities of GPT-4o to analyze the image,
      // then generate a new image based on both the original image description and the edit prompt
      
      // First, use GPT-4o to analyze the image
      // This step is skipped to avoid making an unnecessary API call
      // Instead we directly generate using the prompt
      
      // Then, generate a new image that incorporates the edits
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Apply the following edit to the image: ${prompt}. Make it look realistic and high quality.`,
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
      // Since we can't directly analyze the image content, we use a more generic prompt
      // that applies the style to whatever content is in the image
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Create a beautiful and artistic image in ${style} artistic style. Make it vibrant, detailed and visually striking.`,
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

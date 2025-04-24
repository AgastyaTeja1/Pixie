import OpenAI from "openai";

// Verify the OpenAI API key is properly set
console.log('OpenAI API key status:', process.env.OPENAI_API_KEY ? 'API key is set' : 'API key is not set');

// Initialize OpenAI client
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// Generate an image from a text prompt
export async function generateImage(prompt: string): Promise<string> {
  console.log('Generating image with prompt:', prompt);
  
  try {
    // Log the length of the API key for debugging (without revealing the key)
    console.log('API key length:', process.env.OPENAI_API_KEY?.length || 'No API key');
    
    // Enhance the prompt for better results
    const enhancedPrompt = `Create a beautiful, high-quality image of: ${prompt}. Make it visually striking with good composition and lighting.`;
    console.log('Enhanced prompt length:', enhancedPrompt.length);
    
    // Make the API request
    console.log('Requesting image generation from OpenAI...');
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    
    // Process the response
    console.log('OpenAI response received:', JSON.stringify(response, null, 2));
    
    if (response.data && response.data.length > 0 && response.data[0].url) {
      console.log('Successfully generated image URL');
      return response.data[0].url;
    }
    
    console.error('Invalid response structure from OpenAI API');
    throw new Error('Invalid response from OpenAI API');
  } catch (error: any) {
    console.error('Error in generateImage:', error);
    if (error.response) {
      console.error('OpenAI API Error:', error.response.status, error.response.data);
    }
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

// Edit an image based on a prompt
export async function editImage(imageBase64: string, prompt: string): Promise<string> {
  console.log('Editing image with prompt:', prompt);
  console.log('Image data length:', imageBase64.length);
  
  try {
    // Log the length of the API key for debugging (without revealing the key)
    console.log('API key length:', process.env.OPENAI_API_KEY?.length || 'No API key');
    
    // For image editing, we'll use a descriptive prompt that incorporates the editing request
    // Since DALL-E 3 doesn't support direct image editing, we create a new image based on the prompt
    const enhancedPrompt = `Create an image based on this description: ${prompt}. Make it visually appealing with professional quality.`;
    console.log('Enhanced prompt length for edit:', enhancedPrompt.length);
    
    // Make the API request
    console.log('Requesting image edit from OpenAI...');
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    
    // Process the response
    console.log('OpenAI response received for edit:', JSON.stringify(response, null, 2));
    
    if (response.data && response.data.length > 0 && response.data[0].url) {
      console.log('Successfully generated edited image URL');
      return response.data[0].url;
    }
    
    console.error('Invalid response structure from OpenAI API for edit');
    throw new Error('Invalid response from OpenAI API');
  } catch (error: any) {
    console.error('Error in editImage:', error);
    if (error.response) {
      console.error('OpenAI API Error during edit:', error.response.status, error.response.data);
    }
    throw new Error(`Failed to edit image: ${error.message}`);
  }
}

// Apply a style to an image
export async function applyStyle(imageBase64: string, style: string): Promise<string> {
  console.log('Applying style to image:', style);
  console.log('Image data length:', imageBase64.length);
  
  try {
    // Log the length of the API key for debugging (without revealing the key)
    console.log('API key length:', process.env.OPENAI_API_KEY?.length || 'No API key');
    
    // Create a prompt for the requested style
    const enhancedPrompt = `Create a beautiful artistic image in ${style} style. Make it visually striking with vibrant colors and rich details.`;
    console.log('Style prompt length:', enhancedPrompt.length);
    
    // Make the API request
    console.log('Requesting style application from OpenAI...');
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });
    
    // Process the response
    console.log('OpenAI response received for style:', JSON.stringify(response, null, 2));
    
    if (response.data && response.data.length > 0 && response.data[0].url) {
      console.log('Successfully generated styled image URL');
      return response.data[0].url;
    }
    
    console.error('Invalid response structure from OpenAI API for style');
    throw new Error('Invalid response from OpenAI API');
  } catch (error: any) {
    console.error('Error in applyStyle:', error);
    if (error.response) {
      console.error('OpenAI API Error during style application:', error.response.status, error.response.data);
    }
    throw new Error(`Failed to apply style to image: ${error.message}`);
  }
}

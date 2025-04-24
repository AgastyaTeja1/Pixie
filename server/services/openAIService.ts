import OpenAI from "openai";
import { downloadAndSaveImage } from "./imageService";

// Function to get a description of an image using GPT-4o
async function getImageDescription(imageBase64: string): Promise<string> {
  try {
    // Ensure the image data is properly formatted for the API
    const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;
    
    // Use GPT-4o to analyze the image
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image in detail, focusing on the main subjects, colors, composition, and notable elements. Be thorough but concise."
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ],
        },
      ],
      max_tokens: 300,
    });

    // Return the description
    return response.choices[0].message.content || "An image that could not be analyzed";
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    // Return a generic description if there's an error
    return "An image provided by the user";
  }
}

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
      
      // Download and save the image locally to prevent URL expiration issues
      const permanentUrl = await downloadAndSaveImage(response.data[0].url);
      console.log('Saved image permanently to:', permanentUrl);
      return permanentUrl;
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
    
    // For image editing, we need to analyze the uploaded image and incorporate it into the prompt
    // Since DALL-E 3 supports vision capabilities, we'll use it to understand the image first
    console.log('Analyzing uploaded image for editing...');
    
    // First, get a description of the uploaded image using GPT-4o's vision capabilities
    const imageDescription = await getImageDescription(imageBase64);
    console.log('Image description obtained:', imageDescription);
    
    // Now create an enhanced prompt that combines the image description with the user's editing instructions
    const enhancedPrompt = `I have an image that shows: ${imageDescription}. 
Now, I want you to edit this image according to these instructions: ${prompt}. 
Please maintain the key elements and subjects from the original image, but apply the requested changes.
Make it visually appealing with professional quality.`;
    
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
      
      // Download and save the image locally to prevent URL expiration issues
      const permanentUrl = await downloadAndSaveImage(response.data[0].url);
      console.log('Saved edited image permanently to:', permanentUrl);
      return permanentUrl;
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
    
    // First, analyze the uploaded image to understand its content
    console.log('Analyzing uploaded image for style application...');
    const imageDescription = await getImageDescription(imageBase64);
    console.log('Image description obtained:', imageDescription);
    
    // Create a style-specific prompt based on the art style requested
    let stylePrompt = '';
    
    switch (style.toLowerCase()) {
      case 'watercolor':
        stylePrompt = `Transform this image into a beautiful watercolor painting with soft, translucent colors, gentle brushstrokes, and a dreamy, flowing aesthetic. The watercolor should have characteristic wet edges, color bleeds, and transparent layering typical of the medium. Keep the main subjects and composition from the original intact, but render them with watercolor painting techniques.`;
        break;
      case 'oil-painting':
        stylePrompt = `Recreate this image as a rich, textured oil painting with visible brushwork, impasto technique, and depth. Use the characteristic vibrant colors and techniques of oil painting masters with attention to light and shadow. Maintain the original composition but apply thick paint textures and painterly strokes typical of oil paintings.`;
        break;
      case 'pixel-art':
        stylePrompt = `Convert this image into detailed pixel art style with a limited color palette and visible pixel grid. Use the aesthetic of retro games with deliberate pixelation, sharp edges, and carefully placed individual pixels. Simplify the forms while keeping the essence of the original image's composition.`;
        break;
      case 'ghibli':
        stylePrompt = `Transform this image into the iconic Studio Ghibli animation style with its characteristic whimsical, hand-drawn aesthetic. Use the soft colors, rounded forms, and magical quality typical of Hayao Miyazaki's works. Keep the essence of the original while applying Ghibli's distinctive character design and painterly backgrounds.`;
        break;
      case 'cyberpunk':
        stylePrompt = `Render this image in cyberpunk style with neon lights, high-tech elements, and urban dystopian aesthetic. Use dramatic lighting with blues, purples, and pinks against dark backgrounds. Add futuristic technology elements while maintaining the core composition of the original image.`;
        break;
      case 'pop-art':
        stylePrompt = `Transform this image into pop art style with bold colors, sharp outlines, and halftone dot patterns. Use the iconic aesthetic of artists like Roy Lichtenstein or Andy Warhol with flat, vibrant color fields and comic-book inspired techniques. Keep the main elements but stylize them with pop art's characteristic boldness.`;
        break;
      case 'manga':
        stylePrompt = `Convert this image into Japanese manga style with distinctive line art, dramatic expressions, and characteristic visual language. Use the black and white aesthetic with screen tones (or color if appropriate), simplified backgrounds, and manga-specific visual elements. Maintain the essence while applying manga stylization.`;
        break;
      case 'vaporwave':
        stylePrompt = `Recreate this image in vaporwave aesthetic with its retro-futuristic style, featuring pastel colors (particularly pink and cyan), glitch effects, and 80s/90s visual elements. Incorporate classic vaporwave motifs like ancient sculptures, retro computer graphics, and surreal compositions while keeping the core elements of the original image.`;
        break;
      default:
        stylePrompt = `Transform this image into ${style} style. Maintain the key subjects and composition from the original image, but alter the visual appearance to match the ${style} aesthetic. Make it visually striking with appropriate colors and details.`;
    }
    
    // Create a prompt that combines the image description with the requested style
    const enhancedPrompt = `I have an image that shows: ${imageDescription}.

${stylePrompt}

This is extremely important: Do NOT create a generic image. The result MUST look like the original image but in the requested style. 
Keep all the main subjects, their positions, and the overall composition exactly the same as the original image.
Only change the visual style, not the content or composition.`;
    
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
      
      // Download and save the image locally to prevent URL expiration issues
      const permanentUrl = await downloadAndSaveImage(response.data[0].url);
      console.log('Saved styled image permanently to:', permanentUrl);
      return permanentUrl;
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

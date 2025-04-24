import { useState } from 'react';
import { Loader2, Upload, Download, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64 } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface ArtStyle {
  id: string;
  name: string;
  imageUrl: string;
}

const ART_STYLES: ArtStyle[] = [
  {
    id: 'watercolor',
    name: 'Watercolor',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'oil-painting',
    name: 'Oil Painting',
    imageUrl: 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'ghibli',
    name: 'Ghibli',
    imageUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    imageUrl: 'https://images.unsplash.com/photo-1573455494060-c5595004fb6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'pop-art',
    name: 'Pop Art',
    imageUrl: 'https://images.unsplash.com/photo-1579541591969-45af0f7dff09?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'manga',
    name: 'Manga',
    imageUrl: 'https://images.unsplash.com/photo-1560012054-04e5e8d25478?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    imageUrl: 'https://images.unsplash.com/photo-1600359756098-8bc52195bbf4?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
  }
];

export function ArtStyles() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showAllStyles, setShowAllStyles] = useState(false);
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setUploadedImage(base64);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyStyle = async (styleId: string) => {
    if (!uploadedImage) {
      toast({
        title: 'Image required',
        description: 'Please upload an image first',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setSelectedStyle(styleId);
    try {
      console.log('Starting style application with style:', styleId);
      
      const response = await apiRequest('POST', '/api/ai/style', {
        image: uploadedImage,
        style: styleId,
      });
      
      console.log('Response received:', response);
      
      // Get the response as text first for debugging
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      // Parse the JSON manually to handle potential errors
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Processed response data:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        throw new Error('Invalid JSON response');
      }
      
      if (data && data.imageUrl) {
        console.log('Setting image URL:', data.imageUrl);
        setGeneratedImage(data.imageUrl);
        setGeneratedImageId(data.id);
        
        toast({
          title: 'Style applied',
          description: `Your image has been transformed with ${styleId} style!`,
        });
      } else {
        console.error('Missing data in response:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error applying style:', error);
      
      toast({
        title: 'Style application failed',
        description: 'Failed to apply the art style. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveToCollection = async () => {
    if (!generatedImage || !user) return;
    setIsSaving(true);
    try {
      // Save the image to user's collection
      if (generatedImageId) {
        // If we already have an ID, we can just update the saved status
        await apiRequest('POST', `/api/ai/images/${generatedImageId}/save`, {
          userId: user.id
        });
      } else {
        // Otherwise create a new saved image entry
        await apiRequest('POST', '/api/ai/images/save', {
          imageUrl: generatedImage,
          userId: user.id,
          style: selectedStyle || 'custom style'
        });
      }
      
      toast({
        title: 'Image saved',
        description: 'Image has been saved to your collection',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save image to collection',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const downloadImage = () => {
    if (!generatedImage) return;
    
    // Create anchor element to download image
    const a = document.createElement('a');
    a.href = generatedImage;
    a.download = `pixie-ai-styled-${selectedStyle}-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: 'Image downloaded',
      description: 'Image has been downloaded to your device',
    });
  };

  const shareImage = () => {
    if (!generatedImage) return;
    
    if (navigator.share) {
      navigator.share({
        title: 'Pixie AI Styled Image',
        text: `Check out this image with ${selectedStyle} style from Pixie!`,
        url: generatedImage,
      })
      .catch(() => {
        // If share fails, copy to clipboard instead
        navigator.clipboard.writeText(generatedImage);
        toast({
          title: 'Link copied',
          description: 'Image link copied to clipboard',
        });
      });
    } else {
      // Fallback for browsers that don't support sharing
      navigator.clipboard.writeText(generatedImage);
      toast({
        title: 'Link copied',
        description: 'Image link copied to clipboard',
      });
    }
  };

  const resetArtStyles = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setSelectedStyle(null);
  };

  const displayedStyles = showAllStyles ? ART_STYLES : ART_STYLES.slice(0, 4);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Art Styles</h3>
      <p className="text-gray-600 mb-6">Transform your photos into different art styles</p>
      
      {generatedImage ? (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-white shadow-md relative">
            <img 
              src={generatedImage} 
              alt="Styled Image" 
              className="w-full h-auto"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button 
                    onClick={saveToCollection}
                    disabled={isSaving}
                    className="text-white hover:text-[#5851DB] transition"
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </button>
                  <button 
                    onClick={downloadImage}
                    className="text-white hover:text-[#5851DB] transition"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={shareImage}
                    className="text-white hover:text-[#5851DB] transition"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              onClick={resetArtStyles}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Try Another Style
            </Button>
            
            <Button 
              onClick={() => {
                // Create a post with this image
                const encodedUrl = encodeURIComponent(generatedImage || '');
                console.log('Redirecting to post creation with image:', encodedUrl);
                // Use proper navigation instead of manually creating an anchor
                window.location.href = `/post?imageUrl=${encodedUrl}`;
              }}
              className="flex-1 pixie-gradient text-white hover:shadow-lg"
            >
              Use in Post
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div 
              className="w-full h-40 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer mb-4"
              onClick={() => document.getElementById('style-image-upload')?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
              ) : uploadedImage ? (
                <div className="w-full h-full relative">
                  <img 
                    src={uploadedImage} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedImage(null);
                    }}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Upload an image to transform</p>
                </>
              )}
            </div>
            <input
              id="style-image-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
            />
            <p className="text-sm text-center text-gray-500">
              {uploadedImage ? "Now select a style below" : "First upload an image, then choose a style"}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayedStyles.map((style) => (
              <div 
                key={style.id}
                className={`rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition ${
                  selectedStyle === style.id && isLoading ? 'ring-2 ring-[#5851DB] opacity-50' : ''
                }`}
                onClick={() => handleApplyStyle(style.id)}
              >
                <div className="aspect-w-1 aspect-h-1">
                  <img 
                    src={style.imageUrl} 
                    alt={style.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 text-center bg-white">
                  <p className="font-medium">
                    {selectedStyle === style.id && isLoading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin mr-1" /> 
                        {style.name}
                      </span>
                    ) : (
                      style.name
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {ART_STYLES.length > 4 && (
            <div className="mt-8 text-center">
              <Button
                onClick={() => setShowAllStyles(!showAllStyles)}
                variant="outline"
                className="px-8 py-3 rounded-full font-medium border border-gray-300 hover:border-gray-400 transition"
              >
                {showAllStyles ? 'Show Less Styles' : 'View More Styles'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

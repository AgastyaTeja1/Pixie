import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Download, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  prompt: z.string().min(3, {
    message: "Please provide a detailed description of what you want to create.",
  }).max(1000, {
    message: "The prompt is too long. Please keep it under 1000 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function ImageGenerator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<number | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      console.log('Starting image generation with prompt:', values.prompt);
      
      const response = await apiRequest('POST', '/api/ai/generate', {
        prompt: values.prompt,
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
          title: 'Image generated',
          description: 'Your image has been successfully created!',
        });
      } else {
        console.error('Missing data in response:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      
      toast({
        title: 'Generation failed',
        description: 'Failed to generate the image. Please try again.',
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
      let imageUrl;
      
      if (generatedImageId) {
        // If we already have an ID, we can retrieve the image details
        const response = await apiRequest('POST', `/api/ai/images/${generatedImageId}/save`, {
          userId: user.id
        });
        
        if (response.ok) {
          const data = await response.json();
          imageUrl = data.imageUrl;
        } else {
          throw new Error('Failed to get image details');
        }
      } else {
        // Otherwise create a new AI image entry
        const response = await apiRequest('POST', '/api/ai/images/save', {
          imageUrl: generatedImage,
          userId: user.id,
          prompt: form.getValues().prompt || 'AI generated image'
        });
        
        if (response.ok) {
          const data = await response.json();
          imageUrl = data.imageUrl;
        } else {
          throw new Error('Failed to save image');
        }
      }
      
      // Redirect to post creation with the image URL
      if (imageUrl) {
        toast({
          title: 'Image ready',
          description: 'Add a caption to create your post',
        });
        // Redirect to post creation
        window.location.href = `/post?imageUrl=${encodeURIComponent(imageUrl)}`;
      }
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
    a.download = `pixie-ai-${Date.now()}.jpg`;
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
        title: 'Pixie AI Image',
        text: 'Check out this AI-generated image from Pixie!',
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

  const resetGenerator = () => {
    setGeneratedImage(null);
    setGeneratedImageId(null);
    form.reset();
  };

  return (
    <div className="bg-gradient-to-br from-[#5851DB]/10 to-[#E1306C]/10 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-3">AI Image Creator</h3>
      <p className="text-gray-600 mb-4">Create stunning images from text descriptions</p>
      
      {generatedImage ? (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-white shadow-md relative">
            <img 
              src={generatedImage} 
              alt="AI Generated" 
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
              onClick={resetGenerator}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Create Another
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Describe what you want to create..."
                      className="resize-none h-24 bg-white/80"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium text-white pixie-gradient hover:shadow-lg transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                </>
              ) : (
                'Generate Image'
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}

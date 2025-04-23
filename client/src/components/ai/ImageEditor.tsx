import { useState, ChangeEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Upload, Download, Share2, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64 } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  prompt: z.string().min(3, {
    message: "Please describe the changes you want.",
  }).max(1000, {
    message: "The prompt is too long. Please keep it under 1000 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function ImageEditor() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
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

  const onSubmit = async (values: FormValues) => {
    if (!uploadedImage) {
      toast({
        title: 'Image required',
        description: 'Please upload an image to edit',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/ai/edit', {
        image: uploadedImage,
        prompt: values.prompt,
      });
      
      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      setGeneratedImageId(data.id);
      
      toast({
        title: 'Image edited',
        description: 'Your image has been successfully transformed!',
      });
    } catch (error) {
      toast({
        title: 'Edit failed',
        description: 'Failed to edit the image. Please try again.',
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
          prompt: form.getValues().prompt || 'AI edited image'
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
    a.download = `pixie-ai-edited-${Date.now()}.jpg`;
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
        title: 'Pixie AI Edited Image',
        text: 'Check out this AI-edited image from Pixie!',
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

  const resetEditor = () => {
    setUploadedImage(null);
    setGeneratedImage(null);
    setGeneratedImageId(null);
    form.reset();
  };

  return (
    <div className="bg-gradient-to-br from-[#FCAF45]/10 to-[#E1306C]/10 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-3">Edit Existing Image</h3>
      <p className="text-gray-600 mb-4">Upload an image and transform it</p>
      
      {generatedImage ? (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-white shadow-md relative">
            <img 
              src={generatedImage} 
              alt="AI Edited" 
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
              onClick={resetEditor}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Start Over
            </Button>
            
            <Button 
              onClick={() => {
                // Create a post with this image
                const a = document.createElement('a');
                a.href = '/post';
                a.click();
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
            <div className="mb-4">
              <div 
                className="w-full h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center mb-3 cursor-pointer"
                onClick={() => document.getElementById('image-upload')?.click()}
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
                    <p className="text-sm text-gray-500">Drag an image or click to upload</p>
                  </>
                )}
              </div>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the changes you want..."
                      className="resize-none h-24 bg-white/80"
                      {...field}
                      disabled={!uploadedImage}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              disabled={isLoading || !uploadedImage}
              className="w-full py-3 px-4 rounded-lg font-medium text-white pixie-gradient hover:shadow-lg transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transforming...
                </>
              ) : (
                'Transform Image'
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}

import { useState, ChangeEvent, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { Loader2, Image, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { fileToBase64 } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  caption: z.string().max(2200, {
    message: "Caption must not be longer than 2200 characters.",
  }),
  location: z.string().max(100, {
    message: "Location must not be longer than 100 characters.",
  }).optional(),
  altText: z.string().max(500, {
    message: "Alt text must not be longer than 500 characters.",
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreatePost() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      caption: '',
      location: '',
      altText: '',
    },
  });
  
  // Check for an image URL in localStorage or query parameters
  useEffect(() => {
    // First try to get image from localStorage (for AI-generated images)
    const storedImage = localStorage.getItem('pixie_post_image');
    
    if (storedImage) {
      console.log('Found image in localStorage');
      // Set the image from localStorage
      setUploadedImage(storedImage);
      
      // Set a default caption for AI-generated images
      form.setValue('caption', 'Created with Pixie AI ✨');
      
      // Clear the stored image to avoid it being used again
      localStorage.removeItem('pixie_post_image');
    } else {
      // Fallback to URL parameters
      const searchParams = new URLSearchParams(window.location.search);
      const imageUrl = searchParams.get('imageUrl');
      
      if (imageUrl) {
        console.log('Found image in URL parameters');
        // Set the image from the URL parameter
        setUploadedImage(imageUrl);
        
        // Optional: Set a default caption that mentions AI generation
        if (imageUrl.includes('openai') || imageUrl.includes('dall-e')) {
          form.setValue('caption', 'Created with Pixie AI ✨');
        }
        
        // Clear the URL parameter without refreshing the page
        navigate('/post', { replace: true });
      }
    }
  }, [location, form, navigate]);

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
    
    setUploadingImage(true);
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
      setUploadingImage(false);
    }
  };

  const validateImage = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      // Add a timeout to prevent hanging indefinitely on certain URLs
      setTimeout(() => resolve(false), 5000);
    });
  };

  const onSubmit = async (values: FormValues) => {
    if (!uploadedImage) {
      toast({
        title: 'Image required',
        description: 'Please upload an image for your post',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    // Validate that the image URL is still valid before submission
    const isImageValid = await validateImage(uploadedImage);
    if (!isImageValid) {
      setIsLoading(false);
      toast({
        title: 'Image error',
        description: 'The selected image appears to be invalid or inaccessible. Please try uploading again.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Add a log statement to track image URL before sending
      console.log('Submitting post with image URL:', uploadedImage.substring(0, 100) + '...');
      
      await apiRequest('POST', '/api/posts', {
        ...values,
        mediaUrl: uploadedImage,
      });
      
      toast({
        title: 'Post created',
        description: 'Your post has been created successfully',
      });
      
      // Invalidate feed query to refresh the feed
      queryClient.invalidateQueries({ queryKey: ['/api/feed'] });
      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 p-6">
      <h2 className="text-2xl font-bold font-poppins mb-6">Create a Post</h2>
      
      <div className="mb-6">
        <div className="w-full h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
          {uploadedImage ? (
            <div className="w-full h-full relative">
              <img 
                src={uploadedImage} 
                alt="Preview" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error(`Failed to load preview image: ${uploadedImage}`);
                  e.currentTarget.onerror = null; // Prevent infinite error loop
                  
                  // Show a user-friendly error message
                  toast({
                    title: 'Image loading error',
                    description: 'The image could not be loaded. Try uploading a different image.',
                    variant: 'destructive',
                  });
                  
                  // Replace with an error UI
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmMDAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48bGluZSB4MT0iMTIiIHkxPSI4IiB4Mj0iMTIiIHkyPSIxMiI+PC9saW5lPjxsaW5lIHgxPSIxMiIgeTE9IjE2IiB4Mj0iMTIuMDEiIHkyPSIxNiI+PC9saW5lPjwvc3ZnPg==';
                  e.currentTarget.className = 'w-full h-full object-contain opacity-50';
                  
                  // Add an overlay error message
                  const container = e.currentTarget.parentElement;
                  if (container) {
                    const errorOverlay = document.createElement('div');
                    errorOverlay.className = 'absolute inset-0 flex flex-col items-center justify-center bg-white/80';
                    errorOverlay.innerHTML = `
                      <div class="text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 class="text-lg font-medium text-gray-900">Image Error</h3>
                        <p class="text-sm text-gray-600 mt-1">Failed to load image. Please try again or upload a different image.</p>
                      </div>
                    `;
                    container.appendChild(errorOverlay);
                  }
                }}
              />
              <button
                onClick={() => setUploadedImage(null)}
                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              {uploadingImage ? (
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
                  <p className="text-gray-500">Uploading image...</p>
                </div>
              ) : (
                <>
                  <Image className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-500 mb-2">Drag photos and videos here</p>
                  <label className="px-4 py-2 rounded-lg bg-[#5851DB] text-white font-medium hover:bg-[#5851DB]/90 transition cursor-pointer">
                    Select from computer
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caption</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write a caption..."
                    className="resize-none h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location (optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Add location"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="altText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accessibility</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Add alt text..."
                    {...field}
                  />
                </FormControl>
                <p className="mt-1 text-xs text-gray-500">
                  Alt text helps people with visual impairments
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !uploadedImage}
              className="px-6 py-3 rounded-lg pixie-gradient text-white font-medium hover:shadow-md transition-shadow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sharing...
                </>
              ) : (
                'Share'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

import { useState, ChangeEvent } from 'react';
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
  const [, navigate] = useLocation();
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
    try {
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

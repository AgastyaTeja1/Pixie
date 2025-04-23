import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/ai/generate', {
        prompt: values.prompt,
      });
      
      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      
      toast({
        title: 'Image generated',
        description: 'Your image has been successfully created!',
      });
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: 'Failed to generate the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetGenerator = () => {
    setGeneratedImage(null);
    form.reset();
  };

  return (
    <div className="bg-gradient-to-br from-[#5851DB]/10 to-[#E1306C]/10 p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-3">Generate from Text</h3>
      <p className="text-gray-600 mb-4">Create stunning images from text descriptions</p>
      
      {generatedImage ? (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden bg-white shadow-md">
            <img 
              src={generatedImage} 
              alt="AI Generated" 
              className="w-full h-auto"
            />
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

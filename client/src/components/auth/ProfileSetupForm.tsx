import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Upload } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { fileToBase64, getInitials } from '@/lib/utils';

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }).max(30, {
    message: "Username must not be longer than 30 characters.",
  }).regex(/^[a-zA-Z0-9_\.]+$/, {
    message: "Username can only contain letters, numbers, underscores, and dots.",
  }),
  bio: z.string().max(150, {
    message: "Bio must not be longer than 150 characters.",
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileSetupForm() {
  const { setupProfile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      bio: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await setupProfile(values.username, values.bio, profileImage || undefined);
    } catch (error) {
      console.error('Profile setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setProfileImage(base64);
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold font-poppins">Set up your profile</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us a bit about yourself</p>
      </div>

      <div className="flex flex-col items-center mb-6">
        <div className="relative group cursor-pointer">
          <input
            type="file"
            id="profile-image"
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <label htmlFor="profile-image" className="cursor-pointer">
            <Avatar className="w-24 h-24 border-2 border-white shadow-md">
              <AvatarImage src={profileImage || ''} />
              <AvatarFallback className="bg-gray-200 text-gray-600 text-2xl">
                {getInitials(user?.fullName || '')}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-2">Upload profile picture (optional)</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username*</FormLabel>
                <FormControl>
                  <Input
                    placeholder="@yourusername"
                    {...field}
                    className="px-4 py-3 rounded-lg"
                  />
                </FormControl>
                <p className="mt-1 text-xs text-gray-500">This is how people will find you on Pixie</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a bit about yourself..."
                    className="resize-none h-24 px-4 py-3 rounded-lg"
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating profile...
              </>
            ) : (
              'Create profile'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

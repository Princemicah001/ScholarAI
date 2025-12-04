'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { createMaterial } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';

const urlSchema = z.object({
  sourceType: z.literal('url'),
  url: z.string().url({ message: 'Please enter a valid URL.' }),
  userId: z.string(),
});

const textSchema = z.object({
  sourceType: z.literal('text'),
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  text: z.string().min(50, { message: 'Text must be at least 50 characters.' }),
  userId: z.string(),
});

const fileSchema = z.object({
  sourceType: z.literal('file'),
  file: z.any().refine((val) => val, 'Please upload a file.'),
  userId: z.string(),
});

const formSchema = z.discriminatedUnion('sourceType', [urlSchema, textSchema, fileSchema]);

type FormSchemaType = z.infer<typeof formSchema>;

export function CreateMaterialForm() {
  const [activeTab, setActiveTab] = useState<'url' | 'text' | 'file'>('url');
  const { toast } = useToast();
  const { user } = useUser();
  
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'url',
    },
  });
  
  useEffect(() => {
    if (user?.uid) {
      form.setValue('userId', user.uid);
    }
  }, [user, form]);
  

  const { isSubmitting } = form.formState;

  const handleTabChange = (value: string) => {
    const newTab = value as 'url' | 'text' | 'file';
    setActiveTab(newTab);
    
    // Reset form state and set new default values for the new tab
    form.reset({
      sourceType: newTab,
      userId: user?.uid || '',
      ...(newTab === 'url' && { url: '' }),
      ...(newTab === 'text' && { title: '', text: '' }),
      ...(newTab === 'file' && { file: undefined }),
    });
  };
  
  async function onSubmit(values: FormSchemaType) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to create a material.",
        });
        return;
    }

    const formData = new FormData();
    formData.append('sourceType', values.sourceType);
    formData.append('userId', user.uid);

    if (values.sourceType === 'url') {
      formData.append('url', values.url);
    } else if (values.sourceType === 'text') {
      formData.append('title', values.title);
      formData.append('text', values.text);
    } else if (values.sourceType === 'file' && values.file) {
      formData.append('file', values.file);
    }
    
    try {
      await createMaterial(formData);
      toast({
        title: "Material Created",
        description: "Your new study material is being processed.",
      });
      // The server action will handle redirection
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create material.",
      });
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url">From URL</TabsTrigger>
            <TabsTrigger value="text">From Text</TabsTrigger>
            <TabsTrigger value="file">From File</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="p-6">
                <TabsContent value="url" forceMount={activeTab === 'url'}>
                  {activeTab === 'url' && (
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/article" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
                <TabsContent value="text" forceMount={activeTab === 'text'}>
                  {activeTab === 'text' && (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Introduction to Photosynthesis" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="text"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Paste your article or notes here..."
                                className="min-h-[200px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="file" forceMount={activeTab === 'file'}>
                  {activeTab === 'file' && (
                    <FormField
                      control={form.control}
                      name="file"
                      render={({ field: { onChange, value, ...rest } }) => (
                        <FormItem>
                          <FormLabel>Upload File</FormLabel>
                          <FormControl>
                            <Input 
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.webp"
                              onChange={(e) => {
                                onChange(e.target.files ? e.target.files[0] : null);
                              }} 
                              {...rest}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
              </div>
              <div className="flex items-center justify-end gap-2 border-t p-4">
                <Button type="submit" disabled={isSubmitting || !user}>
                  {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Create Material
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

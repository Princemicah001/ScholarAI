'use client';

import { useState } from 'react';
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

const formSchema = z.discriminatedUnion('sourceType', [urlSchema, textSchema]);

export function CreateMaterialForm() {
  const [activeTab, setActiveTab] = useState('url');
  const { toast } = useToast();
  const { user } = useUser();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceType: 'url',
      url: '',
      userId: user?.uid || '',
    },
  });

  const { isSubmitting } = form.formState;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const defaultData = {
        userId: user?.uid || '',
    };
    form.reset();
    if (value === 'url') {
      form.setValue('sourceType', 'url');
      form.setValue('userId', defaultData.userId);
    } else {
      form.setValue('sourceType', 'text');
      form.setValue('title', '');
      form.setValue('text', '');
      form.setValue('userId', defaultData.userId);
    }
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to create a material.",
        });
        return;
    }
    
    try {
      await createMaterial({...values, userId: user.uid});
      toast({
        title: "Material Created",
        description: "Your new study material is ready.",
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">From URL</TabsTrigger>
            <TabsTrigger value="text">From Text</TabsTrigger>
          </TabsList>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="p-6">
              <TabsContent value="url">
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
              </TabsContent>
              <TabsContent value="text" className="space-y-4">
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

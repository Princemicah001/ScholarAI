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
import { Card, CardContent } from '@/components/ui/card';
import { createMaterial } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
  text: z.string().min(50, { message: 'Text must be at least 50 characters.' }),
  userId: z.string(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export function CreateMaterialForm() {
  const { toast } = useToast();
  const { user } = useUser();
  
  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      text: '',
      userId: '',
    },
  });
  
  useEffect(() => {
    if (user?.uid) {
      form.setValue('userId', user.uid);
    }
  }, [user, form]);
  
  const { isSubmitting } = form.formState;

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
    formData.append('sourceType', 'text');
    formData.append('userId', user.uid);
    formData.append('title', values.title);
    formData.append('text', values.text);
    
    try {
      await createMaterial(formData);
      toast({
        title: "Material Created",
        description: "Your new study material has been saved.",
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="p-6 space-y-4">
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
            <div className="flex items-center justify-end gap-2 border-t p-4">
              <Button type="submit" disabled={isSubmitting || !user}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                Create Material
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

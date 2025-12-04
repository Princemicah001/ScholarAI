'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, useFormState } from 'react-hook-form';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createMaterialFromText, createMaterialFromUrl, createMaterialFromFile } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, FileUp, Link, Text, Upload } from 'lucide-react';
import { useUser } from '@/firebase';

const formSchema = z.object({
  sourceType: z.enum(['text', 'url', 'file']),
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }).optional(),
  content: z.string().min(50, { message: 'Text content must be at least 50 characters.' }).optional(),
  url: z.string().url('Please enter a valid URL.').optional(),
  file: z.any().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

const textSchema = formSchema.pick({ title: true, content: true }).extend({
    title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
    content: z.string().min(50, { message: 'Text must be at least 50 characters.' }),
});
const urlSchema = formSchema.pick({ title: true, url: true }).extend({
    title: z.string().min(3, { message: 'Title must be at least 3 characters.' }),
    url: z.string().url('Please enter a valid URL.'),
});
const fileSchema = formSchema.pick({ file: true }).extend({
    file: z.any().refine((file) => file instanceof File, 'Please upload a file.'),
});

export function CreateMaterialForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'file'>('text');
  const [isPending, startTransition] = useTransition();

  const getResolver = () => {
    switch (activeTab) {
      case 'url':
        return zodResolver(urlSchema);
      case 'file':
        return zodResolver(fileSchema);
      case 'text':
      default:
        return zodResolver(textSchema);
    }
  };

  const form = useForm<FormSchemaType>({
    resolver: getResolver(),
    defaultValues: {
      sourceType: activeTab,
      title: '',
      content: '',
      url: '',
      file: undefined,
    },
    mode: 'onChange',
  });
  
  useEffect(() => {
    form.reset();
    form.setValue('sourceType', activeTab);
  }, [activeTab, form]);

  async function onSubmit(values: FormSchemaType) {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to create a material.",
        });
        return;
    }

    startTransition(async () => {
        const formData = new FormData();
        formData.append('userId', user.uid);
        
        try {
            if (activeTab === 'text') {
                formData.append('title', values.title!);
                formData.append('content', values.content!);
                await createMaterialFromText(formData);
            } else if (activeTab === 'url') {
                formData.append('title', values.title!);
                formData.append('url', values.url!);
                await createMaterialFromUrl(formData);
            } else if (activeTab === 'file') {
                formData.append('file', values.file);
                await createMaterialFromFile(formData);
            }
            toast({
                title: "Processing Started",
                description: "Your material is being created and you will be redirected shortly.",
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || `Failed to create material from ${activeTab}.`,
            });
        }
    });
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'text' | 'url' | 'file')} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text"><Text className="mr-2 h-4 w-4" />Paste Text</TabsTrigger>
                <TabsTrigger value="url"><Link className="mr-2 h-4 w-4" />From URL</TabsTrigger>
                <TabsTrigger value="file"><FileUp className="mr-2 h-4 w-4" />From File</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="text" className="space-y-4 m-0">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Introduction to Photosynthesis" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl><Textarea placeholder="Paste your article or notes here..." className="min-h-[200px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>
                
                <TabsContent value="url" className="space-y-4 m-0">
                   <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl><Input placeholder="e.g., Wikipedia on Black Holes" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="url" render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl><Input placeholder="https://en.wikipedia.org/wiki/Black_hole" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>

                <TabsContent value="file" className="space-y-4 m-0">
                  <FormField
                    control={form.control}
                    name="file"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Upload File</FormLabel>
                         <FormControl>
                            <div className="relative">
                                <Input 
                                    type="file" 
                                    className="h-12 opacity-0 absolute inset-0 w-full z-10 cursor-pointer"
                                    onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                />
                                <div className="h-12 border-2 border-dashed rounded-md flex items-center justify-center text-muted-foreground">
                                    {field.value?.name ? (
                                        <p>{field.value.name}</p>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Upload className="h-5 w-5" />
                                            <span>Click or drag to upload (PDF, DOC, PNG, JPG)</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2 border-t p-4">
            <Button type="submit" disabled={isPending || !user}>
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Create Material
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

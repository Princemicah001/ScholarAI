'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import {
  Form
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createMaterialFromText, createMaterialFromUrl, createMaterialFromFile } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, FileUp, Link, Text } from 'lucide-react';
import { useUser } from '@/firebase';
import { TextTab } from './create-material-tabs/text-tab';
import { UrlTab } from './create-material-tabs/url-tab';
import { FileTab } from './create-material-tabs/file-tab';

type ActiveTab = 'text' | 'url' | 'file';


export function CreateMaterialForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<ActiveTab>('text');
  const [isPending, startTransition] = useTransition();

  const form = useForm();
  
  useEffect(() => {
    form.reset();
  }, [activeTab, form]);

  async function onSubmit(values: any) {
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
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text"><Text className="mr-2 h-4 w-4" />Paste Text</TabsTrigger>
                <TabsTrigger value="url"><Link className="mr-2 h-4 w-4" />From URL</TabsTrigger>
                <TabsTrigger value="file"><FileUp className="mr-2 h-4 w-4" />From File</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="text" className="space-y-4 m-0">
                  <TextTab control={form.control} />
                </TabsContent>
                
                <TabsContent value="url" className="space-y-4 m-0">
                  <UrlTab control={form.control} />
                </TabsContent>

                <TabsContent value="file" className="space-y-4 m-0">
                  <FileTab control={form.control} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2 border-t p-4">
            <Button type="submit" disabled={isPending || !user || !form.formState.isValid}>
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Create Material
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

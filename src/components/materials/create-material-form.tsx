
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createMaterialFromText, createMaterialFromUrl, createMaterialFromFile } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, FileUp, Link, Text } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { TextTab } from './create-material-tabs/text-tab';
import { UrlTab } from './create-material-tabs/url-tab';
import { FileTab } from './create-material-tabs/file-tab';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

type ActiveTab = 'file' | 'text' | 'url';

export function CreateMaterialForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('file');
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: async (data) => {
        return { values: data, errors: {} };
    }
  });

  useEffect(() => {
    form.reset();
  }, [activeTab, form]);

  async function onSubmit(values: any) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to create a source.',
      });
      return;
    }

    startTransition(async () => {
      try {
        let materialId: string | undefined;

        if (activeTab === 'text') {
            const result = await createMaterialFromText(values.title, values.content);
            if(result.error) throw new Error(result.error);
            const docRef = await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/studyMaterials`), {
                userId: user.uid,
                title: result.title,
                sourceType: 'text',
                extractedText: result.extractedText,
                sourceUrl: '',
                uploadDate: new Date().toISOString(),
            });
            materialId = docRef.id;

        } else if (activeTab === 'url') {
            const result = await createMaterialFromUrl(values.title, values.url);
            if(result.error) throw new Error(result.error);
             const docRef = await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/studyMaterials`), {
                userId: user.uid,
                title: result.title,
                sourceType: 'url',
                extractedText: result.extractedText,
                sourceUrl: values.url,
                uploadDate: new Date().toISOString(),
            });
            materialId = docRef.id;

        } else if (activeTab === 'file') {
            const formData = new FormData();
            formData.append('file', values.file);
            const result = await createMaterialFromFile(formData);
            if(result.error) throw new Error(result.error);
             const docRef = await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/studyMaterials`), {
                userId: user.uid,
                title: result.title,
                sourceType: 'file',
                extractedText: result.extractedText,
                sourceUrl: '',
                uploadDate: new Date().toISOString(),
            });
            materialId = docRef.id;
        }
        
        toast({
            title: "Source Created",
            description: "Your study source has been saved successfully.",
        });

        if (materialId) {
            router.push(`/materials/${materialId}`);
        } else {
            router.push('/dashboard');
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || `Failed to create source from ${activeTab}.`,
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
                <TabsTrigger value="file"><FileUp className="mr-2 h-4 w-4" />From File</TabsTrigger>
                <TabsTrigger value="text"><Text className="mr-2 h-4 w-4" />Paste Text</TabsTrigger>
                <TabsTrigger value="url"><Link className="mr-2 h-4 w-4" />From URL</TabsTrigger>
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
              Create Source
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

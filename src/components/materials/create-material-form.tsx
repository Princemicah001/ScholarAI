
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { createMaterialFromTextOrUrl, createMaterialFromFile } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, FileUp, Text, FileText as FileTextIcon, X } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';

type ActiveTab = 'file' | 'text';

export function CreateMaterialForm() {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('file');
  const [isPending, startTransition] = useTransition();

  // State for multi-file upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileStatus, setCurrentFileStatus] = useState('');

  const form = useForm({
    resolver: async (data) => {
        return { values: data, errors: {} };
    }
  });

  const selectedFiles: FileList | undefined = form.watch('files');

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
      let materialId: string | undefined;
        
      try {
        if (activeTab === 'text') {
            const result = await createMaterialFromTextOrUrl(values.title, values.content);
            if(result.error) throw new Error(result.error);
            const docRef = await addDoc(collection(firestore, `users/${user.uid}/studyMaterials`), {
                userId: user.uid,
                title: result.title,
                sourceType: 'text/url',
                extractedText: result.extractedText,
                sourceUrl: '',
                uploadDate: new Date().toISOString(),
            });
            materialId = docRef.id;

        } else if (activeTab === 'file') {
            const files: FileList = values.files;
            if (!files || files.length === 0) {
              throw new Error("No files selected.");
            }

            setIsUploading(true);
            let combinedText = '';
            let failedFiles = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setCurrentFileStatus(`Processing file ${i + 1} of ${files.length}: ${file.name}`);
                setUploadProgress(((i + 1) / files.length) * 100);

                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const result = await createMaterialFromFile(formData);
                    if(result.error) {
                        throw new Error(result.error);
                    };
                    combinedText += result.extractedText + '\n\n';
                } catch (e: any) {
                    console.error(`Failed to process file ${file.name}: ${e.message}`);
                    failedFiles.push(file.name);
                    toast({
                      variant: 'destructive',
                      title: `Processing Failed for ${file.name}`,
                      description: e.message,
                    });
                }
            }

            if (failedFiles.length === files.length) {
                throw new Error("All files failed to process. Please check the files and try again.");
            }

            // Use the name of the first file as the title, or a generic title
            const title = files.length > 1 ? `Combined Source (${files.length} files)` : files[0].name;

            const docRef = await addDoc(collection(firestore, `users/${user.uid}/studyMaterials`), {
                userId: user.uid,
                title: title,
                extractedText: combinedText,
                sourceType: 'file-batch',
                sourceUrl: '',
                uploadDate: new Date().toISOString(),
            });
            materialId = docRef.id;
        }
        
        toast({
            title: "Source Created",
            description: "Your study source has been saved successfully.",
        });

        router.refresh();
        if (materialId) {
            router.push(`/materials/${materialId}`);
        } else {
             router.push('/dashboard');
        }

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error Creating Source',
          description: error.message || `An unexpected error occurred. Please try again.`,
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setCurrentFileStatus('');
      }
    });
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" disabled={isUploading}><FileUp className="mr-2 h-4 w-4" />Upload File</TabsTrigger>
                <TabsTrigger value="text" disabled={isUploading}><Text className="mr-2 h-4 w-4" />Text or URL</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="file" className="space-y-4 m-0">
                   <FormField
                      control={form.control}
                      name="files"
                      rules={{ required: activeTab === 'file' ? 'Please select at least one file.' : false }}
                      render={({ field: { onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Upload Files (PDF, DOCX, JPG, etc.)</FormLabel>
                          <FormControl>
                             <div>
                                {selectedFiles && selectedFiles.length > 0 ? (
                                    <div className="space-y-2">
                                        {Array.from(selectedFiles).map((file, index) => (
                                            <div key={index} className="flex items-center justify-between rounded-md border p-2">
                                                <div className="flex items-center gap-2">
                                                    <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{file.name}</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => form.setValue('files', undefined)} disabled={isUploading}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                     <div className="flex items-center justify-center w-full">
                                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <FileUp className="w-8 h-8 mb-4 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                <p className="text-xs text-muted-foreground">PDF, DOCX, PNG, JPG (MAX. 5MB per file)</p>
                                            </div>
                                            <Input 
                                            id="dropzone-file" 
                                            {...fieldProps}
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                                            multiple
                                            onChange={(event) => {
                                                onChange(event.target.files);
                                            }}
                                            disabled={isUploading}
                                            />
                                        </label>
                                    </div> 
                                )}
                             </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </TabsContent>
                <TabsContent value="text" className="space-y-4 m-0">
                   <>
                      <FormField
                        control={form.control}
                        name="title"
                        rules={{ required: activeTab === 'text' ? 'Please enter a title.' : false }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Photosynthesis Notes" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="content"
                        rules={{ required: activeTab === 'text' ? 'Please paste your content or a URL.' : false }}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content or URL</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Paste your study material or a web URL here..."
                                className="min-h-[200px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter className="flex items-center justify-between gap-2 border-t p-4">
             <div className="flex-grow">
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground truncate">{currentFileStatus}</p>
                </div>
              )}
            </div>
            <Button type="submit" disabled={isPending || !user || isUploading}>
              {(isPending || isUploading) && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Create Source
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

    
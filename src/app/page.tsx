import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { BookOpen, FileInput, TestTube, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import NextLink from 'next/link';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');
  const featureExtractionImage = PlaceHolderImages.find((img) => img.id === 'feature-extraction');
  const featureGuideImage = PlaceHolderImages.find((img) => img.id === 'feature-guide');
  const featureAssessmentImage = PlaceHolderImages.find((img) => img.id === 'feature-assessment');

  const features = [
    {
      icon: <FileInput className="size-8 text-primary" />,
      title: 'Content Extraction',
      description: 'Effortlessly extract text from documents, images, and websites to build your study library.',
      image: featureExtractionImage
    },
    {
      icon: <BookOpen className="size-8 text-primary" />,
      title: 'AI Study Guides',
      description: 'Automatically generate comprehensive study guides from your materials, focusing on key concepts.',
      image: featureGuideImage
    },
    {
      icon: <TestTube className="size-8 text-primary" />,
      title: 'AI Assessments',
      description: 'Create customized tests with various question types to challenge your knowledge and retention.',
      image: featureAssessmentImage
    },
    {
      icon: <TrendingUp className="size-8 text-primary" />,
      title: 'Performance Tracking',
      description: 'Get detailed feedback on your test results and track your learning progress over time.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col relative">
       {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          fill
          className="object-cover -z-20"
          data-ai-hint={heroImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-background/80 -z-10" />

      <SiteHeader />
      <main className="flex-1">
        <section
          className="relative w-full py-12 md:py-24 lg:py-32"
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col justify-center items-center text-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-foreground">
                  Unlock Your Learning Potential with ScholarAI
                </h1>
                <p className="max-w-[600px] text-foreground/80 md:text-xl">
                  Your personal AI-powered study partner. Transform any content into study guides, quizzes, and more.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <NextLink href="/signup">Get Started for Free</NextLink>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <NextLink href="/login">Sign In</NextLink>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Learn Smarter, Not Harder</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  ScholarAI provides a suite of powerful tools to enhance your study sessions and boost your academic performance.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-4 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="h-full bg-card/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-secondary p-4">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-muted-foreground">
                    {feature.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Revolutionize Your Studies?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Create an account and start leveraging the power of AI in your learning journey today.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
               <Button asChild size="lg" className="w-full">
                  <NextLink href="/signup">Join ScholarAI Now</NextLink>
                </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center w-full h-24">
        <p className="text-muted-foreground">&copy; 2024 ScholarAI. All rights reserved.</p>
      </footer>
    </div>
  );
}

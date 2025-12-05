
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Cognify - AI-Powered Learning Tools',
    template: '%s | Cognify',
  },
  description: 'Cognify is your personal AI-powered study partner. Transform any content from PDFs, documents, or websites into study guides, quizzes, flashcards, and track your learning progress. Leverage AI for education in Kenya, Africa, and beyond.',
  keywords: ['AI study tools', 'learning assistant', 'study guide generator', 'quiz creator', 'flashcards', 'education technology', 'Next.js', 'Firebase', 'Cognify', 'Scholar AI', 'AI examiner', 'exam generator AI', 'PDF to text AI', 'PDF reader AI', 'document analysis AI', 'AI for students', 'online learning tools', 'automated quiz generation', 'AI-powered assessment', 'intelligent study guide', 'personalized learning', 'Law AI', 'Coding and Law', 'AI products', 'Kenya tech', 'Africa tech', 'innovation tech Kenya', 'Prince Micah'],
  openGraph: {
    title: 'Cognify - AI-Powered Learning Tools',
    description: 'Transform any content into dynamic study materials with your personal AI study partner.',
    url: 'https://cognify-app.com', // Replace with your actual domain
    siteName: 'Cognify',
    images: [
      {
        url: 'https://cognify-app.com/og-image.png', // Replace with your actual Open Graph image URL
        width: 1200,
        height: 630,
        alt: 'Cognify - Learn Smarter, Not Harder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cognify - AI-Powered Learning Tools',
    description: 'Cognify turns your documents, notes, and web pages into effective study materials using AI.',
    // creator: '@yourtwitterhandle', // Replace with your Twitter handle
    images: ['https://cognify-app.com/twitter-image.png'], // Replace with your actual Twitter image URL
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn('font-sans antialiased', inter.variable)}>
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}


import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google'; // Assuming Geist is local or handled by Next.js build
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Arena Klein Beach Tennis',
  description: 'Reserve sua quadra de beach tennis na Arena Klein.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", geistSans.variable, geistMono.variable)}>
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1 container py-8">
              {children}
            </main>
            {/* Optional Footer can be added here */}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

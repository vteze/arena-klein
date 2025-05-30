
import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

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
    <html lang="pt-BR" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
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

    
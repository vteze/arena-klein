
import type {Metadata} from 'next';
import localFont from 'next/font/local'; // Changed from next/font/google
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

// Configure Geist Sans locally
// Make sure GeistVariableVF.woff2 is in src/app/fonts/
const geistSans = localFont({
  src: './fonts/GeistVariableVF.woff2', // Path relative to this layout.tsx file
  variable: '--font-geist-sans',
  display: 'swap',
  weight: '100 900', // Specify weight range for variable font
});

// Configure Geist Mono locally
// Make sure GeistMonoVariableVF.woff2 is in src/app/fonts/
const geistMono = localFont({
  src: './fonts/GeistMonoVariableVF.woff2', // Path relative to this layout.tsx file
  variable: '--font-geist-mono',
  display: 'swap',
  weight: '100 900', // Specify weight range for variable font
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

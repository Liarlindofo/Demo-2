import type { Metadata } from 'next';
import { StackProvider, StackTheme } from '@stackframe/stack';
import { stackServerApp } from '@/stack';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { GlobalErrorHandler } from '@/components/global-error-handler';
import { ErrorBoundary } from '@/components/error-boundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Platefull',
  description: 'Um novo universo para o seu negocio comeca aqui',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
    shortcut: '/favicon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const bodyClasses = [geistSans.variable, geistMono.variable, 'antialiased'].join(' ');
  
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className={bodyClasses}>
        <ErrorBoundary>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              <GlobalErrorHandler />
              {children}
            </StackTheme>
          </StackProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
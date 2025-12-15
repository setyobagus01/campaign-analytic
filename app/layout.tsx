import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TikTok Campaign Analytics',
  description: 'Manage and analyze your TikTok influencer campaigns.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-muted/20">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto max-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

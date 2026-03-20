import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pocket Trade Hub',
  description: 'Trade Pokemon cards with players worldwide',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-text min-h-screen">{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SonifySTEM AI — Hear the Diagram',
  description:
    'SonifySTEM AI turns STEM diagrams — graphs, circuits, biology diagrams — into interactive 2D spatial audio landscapes for blind and low-vision students.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-lab-bg text-lab-text antialiased">{children}</body>
    </html>
  );
}

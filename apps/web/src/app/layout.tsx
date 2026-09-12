import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mercury — Market Intelligence',
  description: 'Plataforma de inteligencia de mercado para Cuba',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.React.JSX.Element {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

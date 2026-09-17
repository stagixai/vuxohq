import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VUXO.HQ | Secure B2B Infrastructure',
  description: 'Next-Gen Executive Voice & Clinical Synthesis Engine',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

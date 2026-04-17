import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Infrastructure Availability Checker',
  description: 'Step-by-step Japanese address matching and network eligibility checker.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

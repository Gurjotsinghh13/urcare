import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'URCARE - Smart Quarantine Facility Management System',
  description: 'Better Coordination. Faster Recovery. Smarter Care. Enterprise quarantine management platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}

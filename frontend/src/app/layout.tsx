import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'LoanPilot | Smart Loan Eligibility & Faster Approvals',
  description: 'LoanPilot is a secure digital platform that simplifies your loan journey by helping you check your eligibility, compare loan options, and connect with trusted banks and NBFCs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'sonner'
import Navbar from '@/components/Navbar'
import MatchNotification from '@/components/MatchNotification'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VeraTrust - Verified Dating',
  description: 'A dating app where trust and verification matter.',
  keywords: ['dating', 'trust', 'verification', 'relationships', 'secure dating'],
  authors: [{ name: 'VeraTrust Team' }],
  openGraph: {
    title: 'VeraTrust - Verified Dating',
    description: 'A dating app where trust and verification matter.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VeraTrust - Verified Dating',
    description: 'A dating app where trust and verification matter.',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#FF4B91',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <main className="min-h-screen pb-16">
            {children}
          </main>
          <Navbar />
          <Toaster position="top-center" />
          <MatchNotification />
        </AuthProvider>
      </body>
    </html>
  )
} 
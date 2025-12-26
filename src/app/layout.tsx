import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { AuthProvider } from '@/lib/context/AuthContext'
import { ChallengeProvider } from '@/lib/context/ChallengeContext'
import { SyncProvider } from '@/lib/context/SyncContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '75 Hard Challenge',
  description: 'PWA para tracking rigoroso do desafio 75 Hard',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a1a1a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ChallengeProvider>
            <SyncProvider>
              {children}
            </SyncProvider>
          </ChallengeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

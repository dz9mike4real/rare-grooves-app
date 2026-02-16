import React from "react"
import type { Metadata } from 'next'
import { Poppins, Open_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Rare Grooves - Discover Rare Jazz, Funk, Soul & More',
  description: 'Discover and sample rare tracks from jazz, funk, soul, R&B, reggae, and afrobeat. Create samples, save favorites, and share your finds.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${poppins.variable} ${openSans.variable} font-sans antialiased min-h-screen bg-[#121212]`}>
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

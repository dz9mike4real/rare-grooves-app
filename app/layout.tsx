import React from "react"
import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
      </head>
      <body suppressHydrationWarning className={`${outfit.variable} ${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground tracking-tight`}>
        <div className="bg-noise" aria-hidden="true" />
        <MantineProvider defaultColorScheme="auto">
          {children}
          <Notifications />
          <Analytics />
        </MantineProvider>
      </body>
    </html >
  )
}

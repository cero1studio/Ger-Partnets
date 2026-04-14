import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Portal de Aliados Estratégicos | Global Express',
  description: 'Plataforma de gestión de leads y referidos para aliados estratégicos de Global Express. Registra referidos, monitorea estatus y accede a herramientas exclusivas.',
  metadataBase: new URL('https://partners.globalexpress.com'),
  openGraph: {
    title: 'Portal de Aliados Estratégicos | Global Express',
    description: 'Plataforma de gestión de leads y referidos para aliados estratégicos de Global Express.',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Global Express – Área Digital',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portal de Aliados Estratégicos | Global Express',
    description: 'Plataforma de gestión de leads y referidos para aliados estratégicos de Global Express.',
  },
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
    <html lang="es" className="bg-background">
      <body className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

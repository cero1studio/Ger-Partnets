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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="bg-background">
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

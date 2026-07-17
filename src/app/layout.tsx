import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'SATEM Food Engine',
    template: '%s | SATEM Food Engine',
  },
  description:
    'Plataforma SaaS para restaurantes, cafeterías y food trucks. Carta digital, pedidos por chatbot, pagos y gestión de inventario.',
  keywords: ['restaurante', 'food truck', 'carta digital', 'pedidos online', 'saas', 'chile'],
  authors: [{ name: 'SATEM' }],
  creator: 'SATEM',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}

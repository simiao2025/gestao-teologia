import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Curso de Teologia - Sistema Acadêmico',
  description: 'Sistema completo para administração acadêmica e controle interno do Curso de Teologia',
  keywords: 'teologia, curso, formação, ministerial, sistema acadêmico',
  authors: [{ name: 'MiniMax Agent' }],
  creator: 'MiniMax Agent',
  publisher: 'Curso de Teologia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
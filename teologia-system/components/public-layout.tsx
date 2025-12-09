'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen, Phone, Mail, MapPin } from 'lucide-react'

interface PublicLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Início', href: '/' },
  { name: 'Sobre', href: '/sobre' },
  { name: 'Disciplinas', href: '/disciplinas' },
  { name: 'Matrícula', href: '/matricula' },
]

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Curso de Teologia</span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/matricula">Matricular-se</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">Curso de Teologia</span>
              </div>
              <p className="text-gray-300 mb-4">
                Formando líderes cristãos com excelência acadêmica e espiritual. 
                Nossa missão é desenvolver ministeriais preparados para servir a Deus e a comunidade.
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">(11) 99999-9999</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">contato@teologia.edu.br</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Área do Aluno
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-blue-400 mt-1" />
                  <div>
                    <p className="text-sm">Rua Exemplo, 123</p>
                    <p className="text-sm">São Paulo - SP</p>
                    <p className="text-sm">CEP: 01234-567</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2024 Curso de Teologia. Todos os direitos reservados.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacidade" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Política de Privacidade
                </Link>
                <Link href="/termos" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Termos de Uso
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
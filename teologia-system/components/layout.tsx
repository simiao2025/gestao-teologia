'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  Users,
  GraduationCap,
  Settings,
  Home,
  ShoppingCart,
  Menu,
  X,
  LogOut,
  User,
  BarChart,
  Building2,
  Calendar
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
  user?: {
    nome: string
    tipo: string
    email?: string // Added to support passing fuller user object
  }
  title?: string
  onLogout?: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Alunos', href: '/dashboard/alunos', icon: Users },
  { name: 'Níveis', href: '/dashboard/niveis', icon: GraduationCap },
  { name: 'Disciplinas', href: '/dashboard/disciplinas', icon: BookOpen },
  { name: 'Pedidos', href: '/dashboard/pedidos', icon: ShoppingCart },
  { name: 'Subnúcleos', href: '/dashboard/subnucleos', icon: Building2 },
  { name: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart },
  { name: 'Lançar Notas', href: '/dashboard/lancamento', icon: GraduationCap },
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

export default function Layout({ children, user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [config, setConfig] = React.useState<any>(null)
  const pathname = usePathname()

  React.useEffect(() => {
    supabase.from('config_sistema').select('nome_instituicao').limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) setConfig(data)
      })
  }, [])

  const nomeSistema = config?.nome_instituicao || 'Sistema Teologia'

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden print:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-card border-r border-border shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <h1 className="text-xl font-bold text-foreground truncate">{nomeSistema}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-4">
            <div className="space-y-2">
              {navigation.filter(item => {
                // Se for monitor, só vê Dashboard e Lançar Notas
                if (user?.tipo === 'monitor') {
                  // Monitores vêem Dashboard, Lançar Notas e Configurações
                  return ['Dashboard', 'Lançar Notas', 'Configurações'].includes(item.name)
                }
                // Admin e Diretoria vê tudo
                return true
              }).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            {/* Botão Sair no menu lateral */}
            {onLogout && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sair
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col print:hidden">
        <div className="flex min-h-0 flex-1 flex-col bg-card border-r border-border">
          <div className="flex h-16 items-center px-4 border-b border-border">
            <h1 className="text-xl font-bold text-foreground truncate">{nomeSistema}</h1>
          </div>
          <nav className="flex-1 px-4 py-4">
            <div className="space-y-2">
              {navigation.filter(item => {
                if (user?.tipo === 'monitor') {
                  return ['Dashboard', 'Lançar Notas', 'Configurações'].includes(item.name)
                }
                return true
              }).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
            {/* Botão Sair no menu lateral */}
            {onLogout && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sair
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border print:hidden">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{user.nome}</span>
                    <span className="text-xs text-gray-500">({user.tipo})</span>
                  </div>
                  {onLogout && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLogout}
                      className="text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Sair
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0 print:m-0">
          {children}
        </main>
      </div>
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  Users,
  BookOpen,
  GraduationCap,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  const { user, loading: authLoading, handleLogout } = useAuth()
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalDisciplinas: 0,
    totalNiveis: 0,
    pedidosPendentes: 0,
    pedidosPagos: 0
  })
  const [recentPedidos, setRecentPedidos] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      loadDashboardData()
    }
  }, [authLoading])

  const loadDashboardData = async () => {
    try {
      // Carregar estatísticas
      const [alunosRes, disciplinasRes, niveisRes, pedidosRes] = await Promise.all([
        supabase.from('alunos').select('id', { count: 'exact', head: true }),
        supabase.from('disciplinas').select('id', { count: 'exact', head: true }),
        supabase.from('niveis').select('id', { count: 'exact', head: true }),
        supabase.from('pedidos').select('*').order('criado_em', { ascending: false }).limit(5)
      ])

      const pedidosPendentes = pedidosRes.data?.filter(p => p.status === 'pendente') || []
      const pedidosPagos = pedidosRes.data?.filter(p => p.status === 'pago') || []

      setStats({
        totalAlunos: alunosRes.count || 0,
        totalDisciplinas: disciplinasRes.count || 0,
        totalNiveis: niveisRes.count || 0,
        pedidosPendentes: pedidosPendentes.length,
        pedidosPagos: pedidosPagos.length
      })

      setRecentPedidos(pedidosRes.data || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total de Alunos',
      value: stats.totalAlunos,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Disciplinas',
      value: stats.totalDisciplinas,
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Níveis',
      value: stats.totalNiveis,
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Pedidos Pendentes',
      value: stats.pedidosPendentes,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema acadêmico</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor.replace('bg-', 'bg-')}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Pedidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Pedidos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPedidos.length > 0 ? (
                <div className="space-y-4">
                  {recentPedidos.map((pedido) => (
                    <div key={pedido.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">Pedido #{pedido.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          R$ {parseFloat(pedido.valor).toFixed(2)}
                        </p>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${pedido.status === 'pago'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : pedido.status === 'pendente'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-muted text-muted-foreground'
                          }`}>
                          {pedido.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum pedido encontrado</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-start">
                <a href="/dashboard/alunos">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Alunos
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="/dashboard/disciplinas">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Gerenciar Disciplinas
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="/dashboard/niveis">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Gerenciar Níveis
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <a href="/dashboard/pedidos">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ver Pedidos
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Status dos Pedidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Pagamentos Aprovados</span>
                  <span className="font-semibold text-green-500">{stats.pedidosPagos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Aguardando Pagamento</span>
                  <span className="font-semibold text-yellow-500">{stats.pedidosPendentes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxa de Conversão</span>
                  <span className="font-semibold text-blue-500">
                    {stats.pedidosPendentes + stats.pedidosPagos > 0
                      ? Math.round((stats.pedidosPagos / (stats.pedidosPendentes + stats.pedidosPagos)) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Alertas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.pedidosPendentes > 0 && (
                  <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-sm">
                      {stats.pedidosPendentes} pedidos aguardando pagamento
                    </span>
                  </div>
                )}
                {stats.totalAlunos === 0 && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm">
                      Nenhum aluno cadastrado ainda
                    </span>
                  </div>
                )}
                {stats.totalDisciplinas === 0 && (
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <BookOpen className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm">
                      Adicione disciplinas para começar
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
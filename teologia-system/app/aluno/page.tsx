'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { BookOpen, GraduationCap, AlertCircle, Clock, Bell, ShieldCheck, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { StudentBanner } from '@/components/student-banner'
import { useAuth } from '@/hooks/useAuth'

function DashboardContent() {
    const searchParams = useSearchParams()
    const isWelcome = searchParams.get('welcome') === 'true'
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        cursando: 0,
        concluidas: 0,
        pendenciasFinanceiras: 0,
        mediaGeral: 0
    })
    const [studentId, setStudentId] = useState<string | null>(null)
    const [studentName, setStudentName] = useState('')

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            // Get Student ID (Database ID)
            const { data: usuario } = await supabase
                .from('usuarios')
                .select('id, nome')
                .eq('email', session.user.email)
                .maybeSingle()

            if (usuario) {
                setStudentId(usuario.id)
                setStudentName(usuario.nome)

                // 1. Fetch Disciplines Stats
                const { data: disciplinas } = await supabase
                    .from('alunos_disciplinas')
                    .select('*')
                    .eq('aluno_id', usuario.id)

                const cursando = disciplinas?.filter(d => d.status === 'cursando').length || 0
                const concluidas = disciplinas?.filter(d => d.status === 'aprovado').length || 0

                // Calculate Average Grid
                const notas = disciplinas?.filter(d => d.nota != null).map(d => d.nota) as number[] || []
                const mediaGeral = notas.length > 0
                    ? notas.reduce((a, b) => a + b, 0) / notas.length
                    : 0

                // 2. Fetch Financial Pendency (Pending Orders)
                const { data: pedidos } = await supabase
                    .from('pedidos')
                    .select('*')
                    .eq('aluno_id', usuario.id)
                    .eq('status', 'pendente')

                const pendenciasFinanceiras = pedidos?.length || 0

                setStats({
                    cursando,
                    concluidas,
                    pendenciasFinanceiras,
                    mediaGeral
                })
            }
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando informações...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Olá, {studentName}</h1>
                    <p className="text-gray-600">Bem-vindo ao seu ambiente acadêmico.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline" className="hidden md:flex">
                        <Link href="/aluno/disciplinas">Ver Disciplinas</Link>
                    </Button>
                </div>
            </div>

            {/* NEW: Student Academic Cycle Banner */}
            {studentId && <StudentBanner alunoId={studentId} />}

            {/* Alertas de Onboarding */}
            {isWelcome && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Alert className="bg-yellow-50 border-yellow-200">
                        <ShieldCheck className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800 font-bold">Ação Obrigatória: Segurança</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                            Para garantir seus próximos acessos sem precisar de links por e-mail,
                            <Link href="/aluno/configuracoes" className="font-bold underline ml-1">
                                crie sua senha agora
                            </Link>.
                        </AlertDescription>
                    </Alert>

                    <Alert className="bg-blue-50 border-blue-200">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800 font-bold">Seu Material Didático</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Não esqueça de solicitar seu material didático na seção
                            <Link href="/aluno/financeiro" className="font-bold underline ml-1">
                                Financeiro
                            </Link> para iniciar seus estudos.
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Cursando</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.cursando}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <GraduationCap className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Concluídas</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.concluidas}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Média Geral</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.mediaGeral.toFixed(1)}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6 flex items-center space-x-4">
                        <div className={`p-3 rounded-full ${stats.pendenciasFinanceiras > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                            <AlertCircle className={`h-6 w-6 ${stats.pendenciasFinanceiras > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pendências</p>
                            <h3 className={`text-2xl font-bold ${stats.pendenciasFinanceiras > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {stats.pendenciasFinanceiras}
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Acesso Rápido</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/aluno/disciplinas" className="flex items-center p-3 hover:bg-gray-50 rounded-lg border transition-colors group">
                            <BookOpen className="h-5 w-5 mr-3 text-blue-500 group-hover:text-blue-600" />
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Minhas Disciplinas</p>
                                <p className="text-sm text-gray-500">Acesse suas notas e materiais</p>
                            </div>
                        </Link>
                        <Link href="/aluno/financeiro" className="flex items-center p-3 hover:bg-gray-50 rounded-lg border transition-colors group">
                            <AlertCircle className="h-5 w-5 mr-3 text-green-500 group-hover:text-green-600" />
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">Financeiro</p>
                                <p className="text-sm text-gray-500">Pedidos e Pagamentos</p>
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Avisos Importantes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500 text-sm">Nenhum aviso no momento.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function StudentDashboard() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Carregando ambiente...</div>}>
            <DashboardContent />
        </Suspense>
    )
}

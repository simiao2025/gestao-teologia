'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Printer, Filter, Calendar, BookOpen, MapPin, Search, ChevronLeft, AlertCircle } from 'lucide-react'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('pedidos')

    // Feedback State
    const [feedback, setFeedback] = useState<{
        isOpen: boolean,
        title: string,
        message: string,
        type: FeedbackType
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    })

    const showFeedback = (title: string, message: string, type: FeedbackType = 'info') => {
        setFeedback({ isOpen: true, title, message, type })
    }

    // Data for Filters
    const [subnucleos, setSubnucleos] = useState<any[]>([])
    const [disciplinas, setDisciplinas] = useState<any[]>([])

    // Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'all',
        subnucleoId: 'all',
        disciplinaId: 'all',
        studentName: ''
    })

    // Results
    const [reportData, setReportData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [summary, setSummary] = useState({ total: 0, count: 0 })

    useEffect(() => {
        loadFilterOptions()
    }, [])

    useEffect(() => {
        // Auto-load on filter change or just on button click? 
        // Usually explicit "Gerar Relatório" is better for heavy reports.
        // But for responsiveness, I'll do auto-load if not heavy.
        // I'll stick to a "Gerar" button for better UX on mobile.
    }, [])

    const loadFilterOptions = async () => {
        const { data: subData } = await supabase.from('subnucleos').select('id, nome').order('nome')
        const { data: discData } = await supabase.from('disciplinas').select('id, nome, codigo').order('nome')

        setSubnucleos(subData || [])
        setDisciplinas(discData || [])
    }

    const generateReport = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('pedidos')
                .select(`
          *,
          disciplinas (
            id,
            nome,
            codigo
          ),
          usuarios (
            nome,
            email,
            alunos (
                id,
                subnucleo_id,
                subnucleos (nome)
            )
          )
        `)
                .order('criado_em', { ascending: false })

            // Apply Filters
            if (filters.status !== 'all') {
                query = query.eq('status', filters.status)
            }

            if (filters.startDate) {
                query = query.gte('criado_em', filters.startDate + 'T00:00:00')
            }

            if (filters.endDate) {
                query = query.lte('criado_em', filters.endDate + 'T23:59:59')
            }

            const { data, error } = await query
            if (error) throw error

            let result = data || []

            // JS Filters for Relation Fields
            if (filters.subnucleoId !== 'all') {
                result = result.filter(r => r.usuarios?.alunos?.[0]?.subnucleo_id === filters.subnucleoId)
            }

            if (filters.disciplinaId !== 'all') {
                result = result.filter(r => r.disciplinas?.id === filters.disciplinaId)
            }

            if (filters.studentName) {
                const term = filters.studentName.toLowerCase()
                result = result.filter(r => r.usuarios?.nome.toLowerCase().includes(term))
            }

            setReportData(result)

            // Calculate Summary
            const total = result.reduce((acc, curr) => acc + (curr.valor || 0), 0)
            setSummary({ total, count: result.length })

        } catch (error: any) {
            console.error('Erro ao gerar relatório:', error)
            showFeedback('Erro', 'Não foi possível gerar o relatório com os filtros selecionados.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <Layout>
            <FeedbackDialog
                isOpen={feedback.isOpen}
                onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                title={feedback.title}
                message={feedback.message}
                type={feedback.type}
            />
            <div className="space-y-6 print:space-y-0">
                <div className="flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild className="rounded-full flex items-center gap-1">
                            <Link href="/dashboard">
                                <ChevronLeft className="h-4 w-4" />
                                Voltar
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
                            <p className="text-gray-600">Central de inteligência e controle</p>
                        </div>
                    </div>
                    <Button onClick={handlePrint} variant="outline">
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="print:hidden">
                    <TabsList>
                        <TabsTrigger value="pedidos">Pedidos Detalhados</TabsTrigger>
                        <TabsTrigger value="financeiro_geral">Resumo Financeiro</TabsTrigger>
                    </TabsList>
                </Tabs>

                {activeTab === 'pedidos' && (
                    <div className="space-y-6">
                        {/* Filters Card */}
                        <Card className="print:hidden bg-gray-50 border-gray-200">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Período (Início)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <Input
                                                type="date"
                                                className="pl-10"
                                                value={filters.startDate}
                                                onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Período (Fim)</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <Input
                                                type="date"
                                                className="pl-10"
                                                value={filters.endDate}
                                                onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select
                                            value={filters.status}
                                            onValueChange={v => setFilters({ ...filters, status: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="pendente">Pendente</SelectItem>
                                                <SelectItem value="pago">Pago</SelectItem>
                                                <SelectItem value="cancelado">Cancelado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Subnúcleo</label>
                                        <Select
                                            value={filters.subnucleoId}
                                            onValueChange={v => setFilters({ ...filters, subnucleoId: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {subnucleos.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Disciplina</label>
                                        <Select
                                            value={filters.disciplinaId}
                                            onValueChange={v => setFilters({ ...filters, disciplinaId: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                {disciplinas.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.codigo} - {d.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium">Nome do Aluno</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                            <Input
                                                placeholder="Buscar por nome..."
                                                className="pl-10"
                                                value={filters.studentName}
                                                onChange={e => setFilters({ ...filters, studentName: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-end">
                                        <Button onClick={generateReport} className="w-full" disabled={loading}>
                                            <Filter className="h-4 w-4 mr-2" />
                                            {loading ? 'Gerando...' : 'Filtrar Dados'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Print Header - Visible only on Print */}
                        <div className="hidden print:block text-center mb-8">
                            <h2 className="text-2xl font-bold">Relatório de Pedidos</h2>
                            <p>Gerado em: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString()}</p>
                        </div>

                        {/* Results */}
                        <Card className="print:shadow-none print:border-none">
                            <CardContent className="p-0">
                                <div className="p-4 bg-blue-50 border-b flex justify-between items-center print:bg-white print:border-b-2">
                                    <div className="flex gap-6">
                                        <div>
                                            <span className="text-sm text-gray-500 block">Total de Registros</span>
                                            <span className="text-xl font-bold">{summary.count}</span>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500 block">Valor Total</span>
                                            <span className="text-xl font-bold text-green-600">{formatCurrency(summary.total)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b print:bg-gray-100">
                                            <tr>
                                                <th className="text-left p-3 font-medium">Data</th>
                                                <th className="text-left p-3 font-medium">Aluno</th>
                                                <th className="text-left p-3 font-medium">Subnúcleo</th>
                                                <th className="text-left p-3 font-medium">Disciplina</th>
                                                <th className="text-left p-3 font-medium">Status</th>
                                                <th className="text-right p-3 font-medium">Valor</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {reportData.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                                                    <td className="p-3 whitespace-nowrap">{formatDate(row.criado_em)}</td>
                                                    <td className="p-3">
                                                        <div className="font-medium">{row.usuarios?.nome}</div>
                                                        <div className="text-xs text-gray-500">{row.usuarios?.email}</div>
                                                    </td>
                                                    <td className="p-3 text-gray-600">
                                                        {row.usuarios?.alunos?.[0]?.subnucleos?.nome || '-'}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-medium">{row.disciplinas?.nome}</div>
                                                        <div className="text-xs text-gray-500">{row.disciplinas?.codigo}</div>
                                                    </td>
                                                    <td className="p-3 capitalize">{row.status}</td>
                                                    <td className="p-3 text-right font-medium">{formatCurrency(row.valor)}</td>
                                                </tr>
                                            ))}
                                            {reportData.length === 0 && (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                                        Nenhum dado encontrado para os filtros selecionados.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Other tabs can be placeholders for now */}
                {activeTab === 'financeiro_geral' && (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                        <p>Em desenvolvimento: Gráficos e Resumos anuais.</p>
                    </div>
                )}
            </div>
        </Layout>
    )
}

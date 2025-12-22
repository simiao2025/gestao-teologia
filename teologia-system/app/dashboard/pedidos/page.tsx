'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ShoppingCart, Search, CheckCircle, XCircle, Filter, ChevronLeft, AlertCircle } from 'lucide-react'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'

export default function PedidosPage() {
    const [loading, setLoading] = useState(true)
    const [pedidos, setPedidos] = useState<any[]>([])
    const [statusFilter, setStatusFilter] = useState('all')

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

    useEffect(() => {
        loadPedidos()
    }, [])

    const loadPedidos = async () => {
        try {
            const { data, error } = await supabase
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

            if (error) throw error

            const formatted = data?.map(p => ({
                id: p.id,
                criado_em: p.criado_em,
                valor: p.valor,
                status: p.status,
                aluno_nome: p.usuarios?.nome || 'Desconhecido',
                aluno_email: p.usuarios?.email || '',
                aluno_subnucleo: p.usuarios?.alunos?.[0]?.subnucleos?.nome || '-',
                disciplina_nome: p.disciplinas?.nome,
                disciplina_codigo: p.disciplinas?.codigo
            })) || []

            setPedidos(formatted)
        } catch (error: any) {
            console.error('Erro ao carregar pedidos:', error)
            showFeedback('Erro', 'Não foi possível carregar a lista de pedidos.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        if (!confirm(`Confirmar alteração para ${newStatus}?`)) return

        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ status: newStatus })
                .eq('id', id)

            if (error) throw error

            // If confirming payment, simplistic enrollment logic could go here
            // But for now, we just update the order.

            showFeedback('Sucesso!', `O status do pedido foi atualizado para ${newStatus}.`, 'success')
            loadPedidos()
        } catch (error: any) {
            console.error('Erro ao atualizar:', error)
            showFeedback('Erro', 'Não foi possível atualizar o status: ' + error.message, 'error')
        }
    }

    const filtered = pedidos.filter(p => {
        const matchesSearch = p.aluno_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.aluno_email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter

        return matchesSearch && matchesStatus
    })

    return (
        <Layout>
            <FeedbackDialog
                isOpen={feedback.isOpen}
                onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                title={feedback.title}
                message={feedback.message}
                type={feedback.type}
            />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild className="rounded-full flex items-center gap-1">
                            <Link href="/dashboard">
                                <ChevronLeft className="h-4 w-4" />
                                Voltar
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Gestão de Pedidos</h1>
                            <p className="text-gray-600">Acompanhe as vendas e pagamentos</p>
                        </div>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar aluno..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pendente">Pendente</SelectItem>
                                    <SelectItem value="pago">Pago</SelectItem>
                                    <SelectItem value="cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-500">Data</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Aluno</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Subnúcleo</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Item</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Valor</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Status</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filtered.map((pedido) => (
                                        <tr key={pedido.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-sm whitespace-nowrap">
                                                {formatDate(pedido.criado_em)}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium">{pedido.aluno_nome}</div>
                                                <div className="text-sm text-gray-500">{pedido.aluno_email}</div>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {pedido.aluno_subnucleo}
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium">{pedido.disciplina_nome}</div>
                                                <div className="text-xs text-blue-600">{pedido.disciplina_codigo}</div>
                                            </td>
                                            <td className="p-4 font-medium whitespace-nowrap">
                                                {formatCurrency(pedido.valor)}
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge status={pedido.status} />
                                            </td>
                                            <td className="p-4">
                                                {pedido.status === 'pendente' && (
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 border-green-200 hover:bg-green-50"
                                                            onClick={() => handleUpdateStatus(pedido.id, 'pago')}
                                                            title="Confirmar Pagamento"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                                            onClick={() => handleUpdateStatus(pedido.id, 'cancelado')}
                                                            title="Cancelar Pedido"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                                Nenhum pedido encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}

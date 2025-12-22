'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase, Disciplina } from '@/lib/supabase'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ShoppingCart, CreditCard, Plus, QrCode, AlertTriangle, MessageCircle, Trash2, AlertCircle } from 'lucide-react'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'
import { PixModal } from '@/components/pix-modal'

export default function StudentFinancialPage() {
    const [loading, setLoading] = useState(true)
    const [pedidos, setPedidos] = useState<any[]>([])
    const [disciplinasList, setDisciplinasList] = useState<Disciplina[]>([])
    const [activeDisc, setActiveDisc] = useState<Disciplina | null>(null)
    const [isExpired, setIsExpired] = useState(false)

    // Modal states
    const [isNewOrderOpen, setIsNewOrderOpen] = useState(false)
    const [selectedBook, setSelectedBook] = useState<string>('')
    const [submitting, setSubmitting] = useState(false)

    // Pix Logic
    const [pixModalOpen, setPixModalOpen] = useState(false)
    const [currentPedido, setCurrentPedido] = useState<any>(null)
    const [user, setUser] = useState<any>(null)

    const [whatsappNumber, setWhatsappNumber] = useState('')

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
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            setUser(session.user)

            // 1. Get student level_id to filter active discipline
            const { data: usuario } = await supabase
                .from('usuarios')
                .select('id, alunos(nivel_atual_id)')
                .eq('email', session.user.email)
                .maybeSingle()

            const studentId = usuario?.id || session.user.id
            const nivelId = (usuario?.alunos as any)?.[0]?.nivel_atual_id

            // 1.1 Fetch WhatsApp Config
            const { data: config } = await supabase
                .from('config_sistema')
                .select('whatsapp_secretaria')
                .maybeSingle()

            if (config?.whatsapp_secretaria) setWhatsappNumber(config.whatsapp_secretaria.replace(/\D/g, ''))

            // 2. Fetch Active Discipline (proximo_pedido)
            if (nivelId) {
                const { data: active } = await supabase
                    .from('disciplinas')
                    .select('*')
                    .eq('nivel_id', nivelId)
                    .eq('status_acad', 'proximo_pedido')
                    .maybeSingle()

                if (active) {
                    setActiveDisc(active)
                    if (active.data_limite_pedido) {
                        const expired = new Date(active.data_limite_pedido) < new Date()
                        setIsExpired(expired)
                    }
                }
            }


            // 3. Load Pedidos
            const { data: pedidosData } = await supabase
                .from('pedidos')
                .select(`
                    *,
                    disciplinas (
                        nome,
                        valor,
                        codigo
                    )
                `)
                .eq('aluno_id', studentId)
                .order('criado_em', { ascending: false })

            setPedidos(pedidosData || [])

            // 4. Load Disciplinas for the select (usually only the active one or all available)
            // Let's keep all disciplines that have a price, but we will control the button
            const { data: discData } = await supabase
                .from('disciplinas')
                .select('*')
                .gt('valor', 0)
                .order('nome')

            setDisciplinasList((discData as Disciplina[]) || [])
        } catch (error) {
            console.error('Error loading financial data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateOrder = async () => {
        if (!selectedBook || !user) return
        if (isExpired && selectedBook === activeDisc?.id) {
            showFeedback('Prazo Encerrado', 'O prazo para solicitar este material já encerrou. Caso precise de ajuda, entre em contato com a secretaria.', 'warning')
            return
        }

        setSubmitting(true)
        try {
            const item = disciplinasList.find(l => l.id === selectedBook)
            if (!item) return

            const { error } = await supabase
                .from('pedidos')
                .insert({
                    aluno_id: user.id,
                    disciplina_id: selectedBook,
                    valor: item.valor,
                    status: 'pendente'
                })

            if (error) throw error

            setIsNewOrderOpen(false)
            setSelectedBook('')
            loadData()
            showFeedback('Pedido Realizado!', 'Seu pedido foi registrado. Você já pode realizar o pagamento via PIX.', 'success')
        } catch (error: any) {
            console.error('Error creating order:', error)
            showFeedback('Erro no Pedido', 'Não foi possível registrar seu pedido: ' + error.message, 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeletePedido = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este pedido?')) return

        setLoading(true)
        try {
            const { error, count } = await supabase
                .from('pedidos')
                .delete({ count: 'exact' }) // Pegar contagem para validar
                .eq('id', id)
                .eq('status', 'pendente')

            if (error) throw error

            if (count === 0) {
                showFeedback('Não Permitido', 'Não foi possível cancelar o pedido. Certifique-se de que ele ainda está pendente.', 'warning')
            } else {
                showFeedback('Cancelado', 'Seu pedido foi cancelado com sucesso.', 'success')
                loadData()
            }
        } catch (error: any) {
            console.error('Error deleting order:', error)
            showFeedback('Erro ao Cancelar', 'Houve um problema ao tentar cancelar seu pedido: ' + error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const openPixModal = (pedido: any) => {
        setCurrentPedido(pedido)
        setPixModalOpen(true)
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando financeiro...</div>
    }

    return (
        <div className="space-y-6">
            <FeedbackDialog
                isOpen={feedback.isOpen}
                onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                title={feedback.title}
                message={feedback.message}
                type={feedback.type}
            />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Financeiro</h1>
                    <p className="text-gray-600">Gerencie seus pedidos e pagamentos</p>
                </div>

                {isExpired ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-bold text-red-700">PRAZO ENCERRADO</span>
                        <Button variant="outline" size="sm" className="ml-2 border-red-200 text-red-700 hover:bg-red-100" asChild>
                            <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="h-4 w-4 mr-2" /> Ajuda via WhatsApp
                            </a>
                        </Button>
                    </div>
                ) : (
                    <Button onClick={() => setIsNewOrderOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                        <Plus className="h-4 w-4 mr-2" />
                        Solicitar Material
                    </Button>
                )}
            </div>

            {/* Banner Informativo se expirado */}
            {isExpired && activeDisc && (
                <Card className="border-red-200 bg-red-50/50">
                    <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="font-bold text-red-800">Atenção!</p>
                                <p className="text-sm text-red-700">
                                    O prazo para pedido do material de <strong>{activeDisc.nome}</strong> encerrou em {new Date(activeDisc.data_limite_pedido!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}h.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm border-gray-100">
                <CardHeader className="border-b bg-gray-50/50">
                    <CardTitle className="flex items-center text-lg">
                        <ShoppingCart className="h-5 w-5 mr-3 text-blue-600" />
                        Histórico de Pedidos
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {pedidos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Item</th>
                                        <th className="px-6 py-4">Valor</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pedidos.map((pedido) => (
                                        <tr key={pedido.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">
                                                {formatDate(pedido.criado_em)}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {pedido.disciplinas?.nome}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {formatCurrency(pedido.valor)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {pedido.status === 'pago' ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none shadow-none">Pago</Badge>
                                                ) : pedido.status === 'pendente' ? (
                                                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none shadow-none">Pendente</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-500">{pedido.status}</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {pedido.status === 'pendente' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeletePedido(pedido.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                                            onClick={() => openPixModal(pedido)}
                                                        >
                                                            <QrCode className="h-4 w-4 mr-2" />
                                                            Pagar via PIX
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <CreditCard className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-medium">Você ainda não possui pedidos registrados.</p>
                            <Button variant="ghost" className="mt-2 text-blue-600" onClick={() => !isExpired && setIsNewOrderOpen(true)} disabled={isExpired}>
                                {isExpired ? 'Prazos encerrados' : 'Realizar meu primeiro pedido'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* New Order Modal */}
            <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-600" />
                            Novo Pedido de Material
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-6 border-y border-gray-100 my-4">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-700">Selecione o Livro / Disciplina</label>
                            <Select value={selectedBook} onValueChange={setSelectedBook}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Toque para escolher..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {disciplinasList.map(disc => (
                                        <SelectItem key={disc.id} value={disc.id}>
                                            {disc.nome} - {formatCurrency(disc.valor)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedBook && (
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total a Pagar</p>
                                <p className="text-2xl font-black text-blue-900">
                                    {formatCurrency(disciplinasList.find(d => d.id === selectedBook)?.valor || 0)}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsNewOrderOpen(false)} className="flex-1">Cancelar</Button>
                        <Button onClick={handleCreateOrder} disabled={!selectedBook || submitting} className="flex-1 bg-green-600 hover:bg-green-700">
                            {submitting ? 'Processando...' : 'Confirmar Pedido'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Pix Modal */}
            <PixModal
                open={pixModalOpen}
                onOpenChange={setPixModalOpen}
                pedido={currentPedido}
                user={user}
                onPaymentSuccess={() => {
                    loadData()
                }}
            />
        </div>
    )
}

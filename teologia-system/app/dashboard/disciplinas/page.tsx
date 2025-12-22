'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import { BookOpen, Plus, Search, Edit, Trash2, ChevronLeft, AlertCircle } from 'lucide-react'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'

export default function DisciplinasPage() {
    const [loading, setLoading] = useState(true)
    const [disciplinas, setDisciplinas] = useState<any[]>([])
    const [niveis, setNiveis] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [levelFilter, setLevelFilter] = useState('all')

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        nome: '',
        codigo: '',
        nivel_id: '',
        valor: '',
        descricao: ''
    })
    const [saving, setSaving] = useState(false)

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
            // Load Disciplinas with Nivel Name
            const { data: dData, error: dError } = await supabase
                .from('disciplinas')
                .select(`
          *,
          niveis (
            nome
          )
        `)
                .order('nome')

            if (dError) throw dError
            setDisciplinas(dData || [])

            // Load Niveis for Select
            const { data: nData, error: nError } = await supabase
                .from('niveis')
                .select('*')
                .order('ordem')

            if (nError) throw nError
            setNiveis(nData || [])

        } catch (error: any) {
            console.error('Erro ao carregar dados:', error)
            showFeedback('Erro', 'Não foi possível carregar as disciplinas ou níveis.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                nome: formData.nome,
                codigo: formData.codigo,
                nivel_id: formData.nivel_id,
                valor: parseFloat(formData.valor.replace(',', '.') || '0'),
                descricao: formData.descricao
            }

            if (editingId) {
                const { error } = await supabase
                    .from('disciplinas')
                    .update(payload)
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('disciplinas')
                    .insert(payload)
                if (error) throw error
            }

            setIsModalOpen(false)
            loadData()
            resetForm()
            showFeedback('Sucesso!', 'Disciplina salva com sucesso.', 'success')
        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            showFeedback('Erro ao Salvar', 'Verifique se o código já existe ou se todos os campos foram preenchidos.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso pode afetar compras e histórico.')) return

        try {
            const { error } = await supabase
                .from('disciplinas')
                .delete()
                .eq('id', id)

            if (error) throw error
            showFeedback('Sucesso!', 'Disciplina excluída com sucesso.', 'success')
            loadData()
        } catch (error: any) {
            console.error('Erro ao excluir:', error)
            showFeedback('Erro', 'Não foi possível excluir a disciplina. Verifique se existem alunos vinculados a ela.', 'error')
        }
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({ nome: '', codigo: '', nivel_id: '', valor: '', descricao: '' })
    }

    const openEdit = (disc: any) => {
        setEditingId(disc.id)
        setFormData({
            nome: disc.nome,
            codigo: disc.codigo,
            nivel_id: disc.nivel_id,
            valor: disc.valor?.toString() || '0',
            descricao: disc.descricao || ''
        })
        setIsModalOpen(true)
    }

    const filtered = disciplinas.filter(d => {
        const matchesSearch = d.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesLevel = levelFilter === 'all' || d.niveis?.nome === levelFilter || d.nivel_id === levelFilter
        return matchesSearch && matchesLevel
    })

    // Get unique level names for filter (or use IDs)
    // For filter UI, we can use the 'niveis' state loaded from DB

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
                            <h1 className="text-3xl font-bold text-gray-900">Disciplinas</h1>
                            <p className="text-gray-600">Gerenciamento da grade curricular e preços</p>
                        </div>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Disciplina
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Buscar disciplina..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={levelFilter} onValueChange={setLevelFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filtrar Nível" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Níveis</SelectItem>
                                    {niveis.map(n => (
                                        <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-500">Código</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Nome</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Nível</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Valor</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filtered.map((disc) => (
                                        <tr key={disc.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-mono text-sm">{disc.codigo}</td>
                                            <td className="p-4">
                                                <div className="font-medium">{disc.nome}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-md">{disc.descricao}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline">
                                                    {disc.niveis?.nome || 'Sem Nível'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 font-medium text-green-700">
                                                {formatCurrency(disc.valor || 0)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="ghost" onClick={() => openEdit(disc)}>
                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(disc.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                Nenhuma disciplina encontrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Editar Disciplina' : 'Nova Disciplina'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Código</Label>
                                    <Input
                                        value={formData.codigo}
                                        onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                                        placeholder="Ex: TE01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nível</Label>
                                    <Select
                                        value={formData.nivel_id}
                                        onValueChange={v => setFormData({ ...formData, nivel_id: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {niveis.map(n => (
                                                <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Nome</Label>
                                <Input
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Valor (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.valor}
                                    onChange={e => setFormData({ ...formData, valor: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Salvando...' : 'Salvar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    )
}

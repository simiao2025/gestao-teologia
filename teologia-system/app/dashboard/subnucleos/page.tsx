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
import { supabase } from '@/lib/supabase'
import { MapPin, Plus, Edit, Trash2, ChevronLeft, AlertCircle } from 'lucide-react'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'

export default function SubnucleosPage() {
    const [loading, setLoading] = useState(true)
    const [subnucleos, setSubnucleos] = useState<any[]>([])
    const [monitores, setMonitores] = useState<any[]>([])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        nome: '',
        endereco: '',
        cidade: '',
        estado: 'TO', // Default
        monitor_id: 'none' // 'none' for select placeholder
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
            // Fetch Subnucleos
            const { data: subData, error: subError } = await supabase
                .from('subnucleos')
                .select(`
          *,
          usuarios (
            nome
          )
        `)
                .order('nome')

            if (subError) throw subError
            setSubnucleos(subData || [])

            // Fetch Monitores
            const { data: monData, error: monError } = await supabase
                .from('usuarios')
                .select('id, nome')
                .eq('tipo', 'monitor')
                .order('nome')

            if (monError) throw monError
            setMonitores(monData || [])

        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload: any = {
                nome: formData.nome,
                endereco: formData.endereco,
                cidade: formData.cidade,
                estado: formData.estado
            }

            if (formData.monitor_id && formData.monitor_id !== 'none') {
                payload.monitor_id = formData.monitor_id
            } else {
                payload.monitor_id = null
            }

            if (editingId) {
                const { error } = await supabase
                    .from('subnucleos')
                    .update(payload)
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('subnucleos')
                    .insert(payload)
                if (error) throw error
            }

            setIsModalOpen(false)
            loadData()
            resetForm()
            showFeedback('Sucesso!', 'Os dados do polo foram salvos corretamente.', 'success')
        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            showFeedback('Erro ao Salvar', 'Não foi possível salvar os dados do polo. Tente novamente.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso pode afetar alunos vinculados.')) return

        try {
            const { error } = await supabase
                .from('subnucleos')
                .delete()
                .eq('id', id)

            if (error) throw error
            showFeedback('Sucesso!', 'O polo foi removido com sucesso.', 'success')
            loadData()
        } catch (error: any) {
            console.error('Erro ao excluir:', error)
            showFeedback('Erro', 'Não foi possível excluir o polo. Verifique se existem alunos ou escalas vinculadas a ele.', 'error')
        }
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({
            nome: '',
            endereco: '',
            cidade: '',
            estado: 'TO',
            monitor_id: 'none'
        })
    }

    const openEdit = (sub: any) => {
        setEditingId(sub.id)
        setFormData({
            nome: sub.nome,
            endereco: sub.endereco || '',
            cidade: sub.cidade,
            estado: sub.estado,
            monitor_id: sub.monitor_id || 'none'
        })
        setIsModalOpen(true)
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
                            <h1 className="text-3xl font-bold text-gray-900">Subnúcleos</h1>
                            <p className="text-gray-600">Polos de ensino regionais</p>
                        </div>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Subnúcleo
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Lista de Polos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-500">Nome</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Localização</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Monitor</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {subnucleos.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium">{sub.nome}</td>
                                            <td className="p-4">
                                                <div className="flex items-center text-gray-600">
                                                    <MapPin className="h-3 w-3 mr-1" />
                                                    {sub.cidade} - {sub.estado}
                                                </div>
                                                <div className="text-xs text-gray-400">{sub.endereco}</div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {sub.usuarios?.nome || 'Nenhum'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="ghost" onClick={() => openEdit(sub)}>
                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(sub.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {subnucleos.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500">
                                                Nenhum subnúcleo cadastrado.
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
                            <DialogTitle>{editingId ? 'Editar Subnúcleo' : 'Novo Subnúcleo'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome do Polo</Label>
                                <Input
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Núcleo Central"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cidade</Label>
                                    <Input
                                        value={formData.cidade}
                                        onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Estado</Label>
                                    <Input
                                        value={formData.estado}
                                        onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                        maxLength={2}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Endereço Completo</Label>
                                <Input
                                    value={formData.endereco}
                                    onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Monitor Responsável</Label>
                                <Select
                                    value={formData.monitor_id}
                                    onValueChange={v => setFormData({ ...formData, monitor_id: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {monitores.map(mon => (
                                            <SelectItem key={mon.id} value={mon.id}>
                                                {mon.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

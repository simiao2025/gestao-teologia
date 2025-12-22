'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { GraduationCap, Plus, Edit, Trash2, ChevronLeft, AlertCircle } from 'lucide-react'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'

export default function NiveisPage() {
    const [loading, setLoading] = useState(true)
    const [niveis, setNiveis] = useState<any[]>([])

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        ordem: ''
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
            const { data, error } = await supabase
                .from('niveis')
                .select('*')
                .order('ordem')

            if (error) throw error
            setNiveis(data || [])
        } catch (error) {
            console.error('Erro ao carregar níveis:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                nome: formData.nome,
                descricao: formData.descricao,
                ordem: parseInt(formData.ordem)
            }

            if (editingId) {
                const { error } = await supabase
                    .from('niveis')
                    .update(payload)
                    .eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('niveis')
                    .insert(payload)
                if (error) throw error
            }

            setIsModalOpen(false)
            loadData()
            resetForm()
            showFeedback('Sucesso!', 'Nível salvo com sucesso.', 'success')
        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            showFeedback('Erro ao Salvar', 'Não foi possível salvar os dados do nível.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('ATENÇÃO: Excluir um nível pode impedir o funcionamento de disciplinas vinculadas. Tem certeza?')) return

        try {
            const { error } = await supabase
                .from('niveis')
                .delete()
                .eq('id', id)

            if (error) throw error
            showFeedback('Sucesso!', 'Nível excluído com sucesso.', 'success')
            loadData()
        } catch (error: any) {
            console.error('Erro ao excluir:', error)
            showFeedback('Erro', 'Não foi possível excluir o nível. Verifique se existem disciplinas ou alunos vinculados a ele.', 'error')
        }
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({ nome: '', descricao: '', ordem: '' })
    }

    const openEdit = (item: any) => {
        setEditingId(item.id)
        setFormData({
            nome: item.nome,
            descricao: item.descricao || '',
            ordem: item.ordem.toString()
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
                            <h1 className="text-3xl font-bold text-gray-900">Níveis de Ensino</h1>
                            <p className="text-gray-600">Gerenciamento dos módulos do curso</p>
                        </div>
                    </div>
                    <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Nível
                    </Button>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-500">Ordem</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Nome</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Descrição</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {niveis.map((nivel) => (
                                        <tr key={nivel.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-mono text-gray-500 bg-gray-50 w-16 text-center mx-4 rounded">{nivel.ordem}</td>
                                            <td className="p-4 font-bold text-lg">{nivel.nome}</td>
                                            <td className="p-4 text-gray-600">{nivel.descricao}</td>
                                            <td className="p-4">
                                                <div className="flex space-x-2">
                                                    <Button size="sm" variant="ghost" onClick={() => openEdit(nivel)}>
                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(nivel.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Editar Nível' : 'Novo Nível'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-2 col-span-3">
                                    <Label>Nome</Label>
                                    <Input
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        placeholder="Ex: Básico"
                                    />
                                </div>
                                <div className="space-y-2 col-span-1">
                                    <Label>Ordem</Label>
                                    <Input
                                        type="number"
                                        value={formData.ordem}
                                        onChange={e => setFormData({ ...formData, ordem: e.target.value })}
                                    />
                                </div>
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

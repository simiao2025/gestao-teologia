'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { User, Save, AlertCircle } from 'lucide-react'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'

export default function StudentProfilePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState('')

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        cpf: '',
        telefone: '',
        endereco: '',
        subnucleo: ''
    })

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
        handleAuthCallback()
    }, [])

    const handleAuthCallback = async () => {
        try {
            // Aguardar um pouco para garantir que o magic link seja processado
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Verificar se há sessão na URL (magic link)
            const { data, error } = await supabase.auth.getUser()

            if (error && error.message !== 'Auth session missing!') {
                console.error('Auth callback error:', error)
                showFeedback('Erro na Autenticação', 'O link de acesso pode ter expirado. Por favor, solicite um novo.', 'error')
                return
            }

            if (data?.user) {
                // Buscar ID do banco
                const { data: usuario } = await supabase
                    .from('usuarios')
                    .select('id')
                    .eq('email', data.user.email)
                    .maybeSingle()

                const activeId = usuario?.id || data.user.id
                setUserId(activeId)
                await loadProfile(activeId)
            } else {
                // Tentar obter sessão novamente após um pequeno delay
                await new Promise(resolve => setTimeout(resolve, 500))
                const { data: retryData, error: retryError } = await supabase.auth.getUser()

                if (retryError || !retryData?.user) {
                    showFeedback('Acesso Negado', 'Você precisa estar autenticado para acessar esta página. Use o link enviado ao seu e-mail.', 'warning')
                } else {
                    // Se conseguiu após retry, carregar perfil
                    // Buscar ID do banco
                    const { data: usuario } = await supabase
                        .from('usuarios')
                        .select('id')
                        .eq('email', retryData.user.email)
                        .maybeSingle()

                    const activeId = usuario?.id || retryData.user.id
                    setUserId(activeId)
                    await loadProfile(activeId)
                }
            }
        } catch (error) {
            console.error('Error in auth callback:', error)
            showFeedback('Erro', 'Houve um problema na sua autenticação. Tente novamente.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const loadProfile = async (userId: string) => {
        try {
            // Primeiro tentamos buscar o aluno pelo ID da sessão
            let { data, error } = await supabase
                .from('alunos')
                .select(`
                    id,
                    cpf,
                    endereco,
                    subnucleo_id,
                    usuarios (
                        id,
                        nome,
                        email,
                        telefone
                    ),
                    subnucleos (
                        nome
                    )
                `)
                .eq('id', userId)
                .maybeSingle()

            // Se não encontrar pelo ID, tentamos pelo email do usuário logado
            if (!data && !error) {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user?.email) {
                    const { data: byEmail } = await supabase
                        .from('alunos')
                        .select(`
                            id,
                            cpf,
                            endereco,
                            subnucleo_id,
                            usuarios!inner (
                                id,
                                nome,
                                email,
                                telefone
                            ),
                            subnucleos (
                                nome
                            )
                        `)
                        .eq('usuarios.email', session.user.email)
                        .maybeSingle()
                    data = byEmail as any
                }
            }

            if (error) throw error

            if (data) {
                const usuario = Array.isArray(data.usuarios) ? data.usuarios[0] : data.usuarios
                setFormData({
                    nome: usuario?.nome || '',
                    email: usuario?.email || '',
                    cpf: data.cpf || '',
                    telefone: usuario?.telefone || '',
                    endereco: data.endereco || '',
                    subnucleo: (Array.isArray(data.subnucleos) ? data.subnucleos[0] : data.subnucleos)?.nome || 'Não vinculado'
                })
            }
        } catch (error) {
            console.error('Error loading profile:', error)
            showFeedback('Erro de Carregamento', 'Não foi possível buscar seus dados de perfil.', 'error')
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            // Update usuarios (telefone)
            const { error: userError } = await supabase
                .from('usuarios')
                .update({ telefone: formData.telefone })
                .eq('id', userId)

            if (userError) throw userError

            // Update alunos (endereco)
            const { error: studentError } = await supabase
                .from('alunos')
                .update({ endereco: formData.endereco })
                .eq('id', userId)

            if (studentError) throw studentError

            showFeedback('Sucesso!', 'Seus dados foram atualizados com sucesso.', 'success')
        } catch (error: any) {
            console.error('Error updating profile:', error)
            showFeedback('Erro ao Salvar', 'Não foi possível atualizar seus dados: ' + error.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando perfil...</div>
    }

    if (error) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Erro de Autenticação</h1>
                    <p className="text-gray-600 mt-2">{error}</p>
                </div>

                <Card>
                    <CardContent className="text-center py-8">
                        <p className="text-gray-600 mb-6">
                            Para acessar seu perfil, você precisa de um link de acesso válido.
                        </p>
                        <Button
                            onClick={() => window.location.href = '/matricula'}
                            className="w-full max-w-xs"
                        >
                            Solicitar Novo Link de Acesso
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <FeedbackDialog
                isOpen={feedback.isOpen}
                onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                title={feedback.title}
                message={feedback.message}
                type={feedback.type}
            />
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Meus Dados</h1>
                <p className="text-gray-600">Mantenha suas informações atualizadas</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Informações Pessoais
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome Completo</Label>
                                <Input id="nome" value={formData.nome} disabled className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" value={formData.email} disabled className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input id="cpf" value={formData.cpf} disabled className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subnucleo">Subnúcleo</Label>
                                <Input id="subnucleo" value={formData.subnucleo} disabled className="bg-gray-100" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Dados Editáveis</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                                    <Input
                                        id="telefone"
                                        value={formData.telefone}
                                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endereco">Endereço Completo</Label>
                                    <Input
                                        id="endereco"
                                        value={formData.endereco}
                                        onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                        placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

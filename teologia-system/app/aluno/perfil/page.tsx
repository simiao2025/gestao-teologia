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
        rg: '',
        telefone: '',
        endereco: '',
        cidade: '',
        uf: '',
        cep: '',
        estado_civil: '',
        naturalidade: '',
        uf_nascimento: '',
        escolaridade: '',
        profissao: '',
        cargo_igreja: '',
        congregacao: '',
        ja_estudou_teologia: false,
        instituicao_teologia: '',
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
                    rg,
                    endereco,
                    cidade,
                    estado,
                    cep,
                    estado_civil,
                    naturalidade,
                    uf_nascimento,
                    escolaridade,
                    profissao,
                    cargo_igreja,
                    congregacao,
                    ja_estudou_teologia,
                    instituicao_teologia,
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
                            rg,
                            endereco,
                            cidade,
                            estado,
                            cep,
                            estado_civil,
                            naturalidade,
                            uf_nascimento,
                            escolaridade,
                            profissao,
                            cargo_igreja,
                            congregacao,
                            ja_estudou_teologia,
                            instituicao_teologia,
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
                    rg: data.rg || '',
                    telefone: usuario?.telefone || '',
                    endereco: data.endereco || '',
                    cidade: data.cidade || '',
                    uf: data.estado || '',
                    cep: data.cep || '',
                    estado_civil: data.estado_civil || '',
                    naturalidade: data.naturalidade || '',
                    uf_nascimento: data.uf_nascimento || '',
                    escolaridade: data.escolaridade || '',
                    profissao: data.profissao || '',
                    cargo_igreja: data.cargo_igreja || '',
                    congregacao: data.congregacao || '',
                    ja_estudou_teologia: data.ja_estudou_teologia || false,
                    instituicao_teologia: data.instituicao_teologia || '',
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

            // Update alunos (endereco, cidade, uf, cep, etc)
            const { error: studentError } = await supabase
                .from('alunos')
                .update({
                    endereco: formData.endereco,
                    cidade: formData.cidade,
                    estado: formData.uf,
                    cep: formData.cep,
                    estado_civil: formData.estado_civil,
                    escolaridade: formData.escolaridade,
                    profissao: formData.profissao,
                    cargo_igreja: formData.cargo_igreja,
                    congregacao: formData.congregacao,
                    ja_estudou_teologia: formData.ja_estudou_teologia,
                    instituicao_teologia: formData.ja_estudou_teologia ? formData.instituicao_teologia : null
                })
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

    if (!userId && !loading) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">Acesso Restrito</h1>
                    <p className="text-gray-600 mt-2">Você precisa estar autenticado para acessar seu perfil.</p>
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
                                <Label htmlFor="rg">RG</Label>
                                <Input id="rg" value={formData.rg} disabled className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subnucleo">Subnúcleo</Label>
                                <Input id="subnucleo" value={formData.subnucleo} disabled className="bg-gray-100" />
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Dados Complementares</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="estado_civil">Estado Civil</Label>
                                    <select
                                        id="estado_civil"
                                        value={formData.estado_civil}
                                        onChange={e => setFormData({ ...formData, estado_civil: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Solteiro(a)">Solteiro(a)</option>
                                        <option value="Casado(a)">Casado(a)</option>
                                        <option value="Divorciado(a)">Divorciado(a)</option>
                                        <option value="Viúvo(a)">Viúvo(a)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="escolaridade">Escolaridade</Label>
                                    <Input
                                        id="escolaridade"
                                        value={formData.escolaridade}
                                        onChange={e => setFormData({ ...formData, escolaridade: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profissao">Profissão</Label>
                                    <Input
                                        id="profissao"
                                        value={formData.profissao}
                                        onChange={e => setFormData({ ...formData, profissao: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="naturalidade">Naturalidade (Cidade/UF)</Label>
                                    <Input value={`${formData.naturalidade} - ${formData.uf_nascimento}`} disabled className="bg-gray-100" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Dados Eclesiásticos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cargo">Cargo na Igreja</Label>
                                    <Input
                                        id="cargo"
                                        value={formData.cargo_igreja}
                                        onChange={e => setFormData({ ...formData, cargo_igreja: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="congregacao">Congregação</Label>
                                    <Input
                                        id="congregacao"
                                        value={formData.congregacao}
                                        onChange={e => setFormData({ ...formData, congregacao: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Origem Acadêmica</h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="ja_estudou"
                                        checked={formData.ja_estudou_teologia}
                                        onChange={e => setFormData({ ...formData, ja_estudou_teologia: e.target.checked })}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <Label htmlFor="ja_estudou">Já estudou Teologia anteriormente?</Label>
                                </div>
                                {formData.ja_estudou_teologia && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <Label htmlFor="instituicao">Instituição que Estudou</Label>
                                        <Input
                                            id="instituicao"
                                            value={formData.instituicao_teologia}
                                            onChange={e => setFormData({ ...formData, instituicao_teologia: e.target.value })}
                                            placeholder="Nome da instituição ou seminário"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Contato e Endereço</h3>
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
                                    <Label htmlFor="endereco">Logradouro (Rua, Número, Bairro)</Label>
                                    <Input
                                        id="endereco"
                                        value={formData.endereco}
                                        onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                        placeholder="Rua, Número, Bairro"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="cidade">Cidade</Label>
                                        <Input
                                            id="cidade"
                                            value={formData.cidade}
                                            onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="uf">UF</Label>
                                        <Input
                                            id="uf"
                                            value={formData.uf}
                                            onChange={e => setFormData({ ...formData, uf: e.target.value })}
                                            maxLength={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="cep">CEP</Label>
                                        <Input
                                            id="cep"
                                            value={formData.cep}
                                            onChange={e => setFormData({ ...formData, cep: e.target.value })}
                                            placeholder="00000-000"
                                        />
                                    </div>
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

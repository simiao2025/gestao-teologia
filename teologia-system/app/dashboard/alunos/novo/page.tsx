'use client'

import React, { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
    ArrowLeft,
    BookOpen,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    ChevronLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'

export default function NovoAlunoPage() {
    const { user, handleLogout } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [subnucleos, setSubnucleos] = useState<any[]>([])
    const [niveis, setNiveis] = useState<any[]>([])

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

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        data_nascimento: '',
        endereco: '',
        subnucleo_id: '',
        nivel_id: ''
    })

    useEffect(() => {
        loadDependencies()
    }, [])

    const loadDependencies = async () => {
        try {
            const { data: subData } = await supabase.from('subnucleos').select('*').order('nome')
            setSubnucleos(subData || [])

            const { data: nivData } = await supabase.from('niveis').select('*').order('ordem')
            setNiveis(nivData || [])

            // Default to first level
            if (nivData && nivData.length > 0) {
                setFormData(prev => ({ ...prev, nivel_id: nivData[0].id }))
            }
        } catch (error) {
            console.error('Erro ao carregar dependências:', error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.nome || !formData.email || !formData.cpf || !formData.subnucleo_id || !formData.nivel_id || !formData.data_nascimento || !formData.endereco || !formData.telefone) {
            showFeedback('Campos Obrigatórios', 'Por favor, preencha todos os campos marcados com (*).', 'warning')
            return
        }

        setIsLoading(true)
        setError('')
        setSuccess('')

        try {
            // Validar CPF
            const cpf = formData.cpf.replace(/\D/g, '')
            if (cpf.length !== 11) {
                showFeedback('CPF Inválido', 'O CPF deve conter exatamente 11 dígitos numéricos.', 'warning')
                return
            }

            // Verificar se usuário admin está logado
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                throw new Error('Usuário não está logado')
            }

            // Criar usuário e aluno usando a função SQL
            const { data: result, error: createError } = await supabase
                .rpc('criar_aluno', {
                    p_nome: formData.nome,
                    p_email: formData.email,
                    p_telefone: formData.telefone,
                    p_cpf: cpf,
                    p_data_nascimento: formData.data_nascimento,
                    p_endereco: formData.endereco,
                    p_subnucleo_id: formData.subnucleo_id,
                    p_nivel_id: formData.nivel_id
                })

            if (createError) {
                console.error('Erro ao criar aluno:', createError)
                if (createError.message?.includes('duplicate key') || createError.message?.includes('already exists')) {
                    if (createError.message?.includes('email')) {
                        setError('Este email já está cadastrado')
                    } else if (createError.message?.includes('cpf')) {
                        setError('Este CPF já está cadastrado')
                    } else {
                        setError('Dados já cadastrados no sistema')
                    }
                } else {
                    setError('Erro ao processar matrícula. Tente novamente.')
                }
                return
            }

            // Enviar magic link por email
            const { error: signInError } = await supabase.auth.signInWithOtp({
                email: formData.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (signInError) {
                console.error('Erro ao enviar magic link:', signInError)
                showFeedback('Sucesso Parcial', 'Aluno cadastrado, mas erro ao enviar link de acesso. Entre em contato com o aluno.', 'warning')
            } else {
                showFeedback('Sucesso!', 'O aluno foi cadastrado com sucesso no sistema e um link de acesso foi enviado para o email do aluno.', 'success')
            }

            router.push('/dashboard/alunos')
        } catch (error: any) {
            console.error('Erro ao criar:', error)
            showFeedback('Erro no Cadastro', error.message || 'Houve um erro ao tentar criar o registro do aluno.', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Layout title="Novo Aluno" user={user} onLogout={handleLogout}>
            <FeedbackDialog
                isOpen={feedback.isOpen}
                onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                title={feedback.title}
                message={feedback.message}
                type={feedback.type}
            />
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-start mb-6 print:hidden">
                    <Button variant="outline" size="sm" asChild className="rounded-full flex items-center gap-1">
                        <Link href="/dashboard/alunos">
                            <ChevronLeft className="h-4 w-4" />
                            Voltar para Lista
                        </Link>
                    </Button>
                </div>

                <div className="text-center mb-8">
                    <div className="flex justify-center">
                        <BookOpen className="h-12 w-12 text-blue-600" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Cadastrar Novo Aluno
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Preencha os dados do aluno para realizar a matrícula
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados Pessoais</CardTitle>
                        <CardDescription>
                            Informe os dados do aluno para realizar a matrícula
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                                    {success}
                                </div>
                            )}

                            {/* Dados pessoais */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="nome" className="text-sm font-medium text-gray-700 flex items-center">
                                        <User className="h-4 w-4 mr-1" />
                                        Nome Completo *
                                    </label>
                                    <Input
                                        id="nome"
                                        placeholder="Nome completo do aluno"
                                        value={formData.nome}
                                        onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                                        <Mail className="h-4 w-4 mr-1" />
                                        Email *
                                    </label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="email@exemplo.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="telefone" className="text-sm font-medium text-gray-700 flex items-center">
                                        <Phone className="h-4 w-4 mr-1" />
                                        Telefone *
                                    </label>
                                    <Input
                                        id="telefone"
                                        placeholder="(11) 99999-9999"
                                        value={formData.telefone}
                                        onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="data_nascimento" className="text-sm font-medium text-gray-700">
                                        Data de Nascimento *
                                    </label>
                                    <Input
                                        id="data_nascimento"
                                        type="date"
                                        value={formData.data_nascimento}
                                        onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="cpf" className="text-sm font-medium text-gray-700 flex items-center">
                                        <CreditCard className="h-4 w-4 mr-1" />
                                        CPF *
                                    </label>
                                    <Input
                                        id="cpf"
                                        placeholder="000.000.000-00"
                                        value={formData.cpf}
                                        onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="endereco" className="text-sm font-medium text-gray-700 flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    Endereço Completo *
                                </label>
                                <Input
                                    id="endereco"
                                    placeholder="Rua, número, bairro, cidade, estado"
                                    value={formData.endereco}
                                    onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subnucleo_id" className="text-sm font-medium text-gray-700">
                                    Subnúcleo *
                                </label>
                                <select
                                    id="subnucleo_id"
                                    value={formData.subnucleo_id}
                                    onChange={e => setFormData({ ...formData, subnucleo_id: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                                >
                                    <option value="">Selecione um subnúcleo</option>
                                    {subnucleos.map((subnucleo) => (
                                        <option key={subnucleo.id} value={subnucleo.id}>
                                            {subnucleo.nome} - {subnucleo.cidade}/{subnucleo.estado}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="nivel_id" className="text-sm font-medium text-gray-700">
                                    Nível Atual *
                                </label>
                                <select
                                    id="nivel_id"
                                    value={formData.nivel_id}
                                    onChange={e => setFormData({ ...formData, nivel_id: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                                >
                                    <option value="">Selecione um nível</option>
                                    {niveis.map((nivel) => (
                                        <option key={nivel.id} value={nivel.id}>
                                            {nivel.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processando...' : 'Cadastrar Aluno'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}

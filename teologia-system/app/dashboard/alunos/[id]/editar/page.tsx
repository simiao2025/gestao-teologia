'use client'

import React, { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { User, Mail, Phone, MapPin, CreditCard, ChevronLeft, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'
import { ESTADOS_CIVIS, ESCOLARIDADE, UFS } from '@/constants/student'

export default function EditarAlunoPage({ params }: { params: { id: string } }) {
    const { user, handleLogout } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
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
        rg: '',
        data_nascimento: '',
        endereco: '',
        subnucleo_id: '',
        nivel_id: '',
        estado_civil: '',
        naturalidade: '',
        uf_nascimento: '',
        escolaridade: '',
        profissao: '',
        cargo_igreja: '',
        congregacao: '',
        ja_estudou_teologia: false,
        instituicao_teologia: '',
        cidade: '',
        uf: '',
        cep: '',
        status: '',
        usuario_id: '' // ID da tabela usuarios
    })

    useEffect(() => {
        loadData()
    }, [params.id])

    const loadData = async () => {
        setIsLoading(true)
        try {
            // Load Dependencies
            const { data: subData } = await supabase.from('subnucleos').select('*').order('nome')
            setSubnucleos(subData || [])

            const { data: nivData } = await supabase.from('niveis').select('*').order('ordem')
            setNiveis(nivData || [])

            // Load Student Data
            const { data: aluno, error } = await supabase
                .from('alunos')
                .select(`
                    id,
                    cpf,
                    rg,
                    data_nascimento,
                    endereco,
                    subnucleo_id,
                    nivel_atual_id,
                    estado_civil,
                    naturalidade,
                    uf_nascimento,
                    escolaridade,
                    profissao,
                    cargo_igreja,
                    congregacao,
                    ja_estudou_teologia,
                    instituicao_teologia,
                    cidade,
                    estado,
                    cep,
                    status,
                    usuario_id:id, 
                    usuarios:id (
                        nome,
                        email,
                        telefone
                    )
                `)
                .eq('id', params.id)
                .single()

            if (error) throw error
            if (!aluno) throw new Error('Aluno não encontrado')

            // Note: In our system, aluno.id is often same as usuario.id, but let's be safe
            // The relationship 'usuarios:id' assumes 1:1 on PKs. 
            // Correct way is: 
            // users table: id, nome, email, telefone
            // alunos table: id (FK->users), cpf, etc.

            const usuario = Array.isArray(aluno.usuarios) ? aluno.usuarios[0] : aluno.usuarios

            setFormData({
                nome: usuario?.nome || '',
                email: usuario?.email || '',
                telefone: usuario?.telefone || '',
                cpf: aluno.cpf || '',
                rg: aluno.rg || '',
                data_nascimento: aluno.data_nascimento || '',
                endereco: aluno.endereco || '',
                subnucleo_id: aluno.subnucleo_id || '',
                nivel_id: aluno.nivel_atual_id || nivData?.[0]?.id || '',
                estado_civil: aluno.estado_civil || '',
                naturalidade: aluno.naturalidade || '',
                uf_nascimento: aluno.uf_nascimento || '',
                escolaridade: aluno.escolaridade || '',
                profissao: aluno.profissao || '',
                cargo_igreja: aluno.cargo_igreja || '',
                congregacao: aluno.congregacao || '',
                ja_estudou_teologia: aluno.ja_estudou_teologia || false,
                instituicao_teologia: aluno.instituicao_teologia || '',
                cidade: aluno.cidade || '',
                uf: aluno.estado || '',
                cep: aluno.cep || '',
                status: aluno.status || '',
                usuario_id: aluno.id // Assuming ID matches
            })

        } catch (error: any) {
            console.error('Erro ao carregar dados:', error)
            showFeedback('Erro', 'Não foi possível carregar os dados do aluno.', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nome || !formData.email || !formData.cpf) {
            showFeedback('Atenção', 'Preencha os campos obrigatórios.', 'warning')
            return
        }

        setIsSaving(true)
        try {
            // 1. Update Usuario Data (Nome, Telefone) - Email is usually immutable or requires auth update
            // Updating email in auth.users requires admin API. We'll update only public metadata if separate.
            // Assuming 'usuarios' is our public users table.

            const { error: userError } = await supabase
                .from('usuarios')
                .update({
                    nome: formData.nome,
                    telefone: formData.telefone
                    // Email update might break auth if email is login. Skipping email update for safety here or need specific logic.
                })
                .eq('id', params.id)

            if (userError) throw userError

            // 2. Update Aluno Data
            const { error: alunoError } = await supabase
                .from('alunos')
                .update({
                    cpf: formData.cpf,
                    rg: formData.rg,
                    data_nascimento: formData.data_nascimento,
                    endereco: formData.endereco,
                    nivel_atual_id: formData.nivel_id,
                    estado_civil: formData.estado_civil,
                    naturalidade: formData.naturalidade,
                    uf_nascimento: formData.uf_nascimento,
                    escolaridade: formData.escolaridade,
                    profissao: formData.profissao,
                    cargo_igreja: formData.cargo_igreja,
                    congregacao: formData.congregacao,
                    ja_estudou_teologia: formData.ja_estudou_teologia,
                    instituicao_teologia: formData.ja_estudou_teologia ? formData.instituicao_teologia : null,
                    cidade: formData.cidade,
                    estado: formData.uf,
                    cep: formData.cep,
                    status: formData.status
                })
                .eq('id', params.id)

            if (alunoError) throw alunoError

            showFeedback('Sucesso', 'Dados do aluno atualizados!', 'success')
            // router.push('/dashboard/alunos') // Optional redirect??

        } catch (error: any) {
            console.error('Erro ao salvar:', error)
            showFeedback('Erro', 'Não foi possível salvar as alterações.', 'error')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Layout title="Editar Aluno" user={user} onLogout={handleLogout}>
            <FeedbackDialog
                isOpen={feedback.isOpen}
                onClose={() => {
                    setFeedback(prev => ({ ...prev, isOpen: false }))
                    if (feedback.type === 'success') {
                        router.push('/dashboard/alunos')
                    }
                }}
                title={feedback.title}
                message={feedback.message}
                type={feedback.type}
            />
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-start mb-6">
                    <Button variant="outline" size="sm" asChild className="rounded-full flex items-center gap-1">
                        <Link href="/dashboard/alunos">
                            <ChevronLeft className="h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>
                </div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Edit className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Editar Aluno</h2>
                        <p className="text-gray-600">Atualize os dados cadastrais</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Dados Pessoais</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="p-8 text-center">Carregando dados...</div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nome Completo</label>
                                        <Input
                                            value={formData.nome}
                                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email (Somente Leitura)</label>
                                        <Input
                                            value={formData.email}
                                            disabled
                                            className="bg-gray-50"
                                            title="Para alterar o email, contate o suporte técnico."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Telefone</label>
                                        <Input
                                            value={formData.telefone}
                                            onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Data Nascimento</label>
                                        <Input
                                            type="date"
                                            value={formData.data_nascimento}
                                            onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">CPF</label>
                                        <Input
                                            value={formData.cpf}
                                            onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">RG</label>
                                        <Input
                                            value={formData.rg}
                                            onChange={e => setFormData({ ...formData, rg: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status do Aluno</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                        >
                                            <option value="ativo">Ativo</option>
                                            <option value="trancado">Trancado</option>
                                            <option value="desistente">Desistente</option>
                                            <option value="concluído">Concluído</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Endereço (Rua, Número, Bairro)</label>
                                    <Input
                                        placeholder="Rua, número, bairro"
                                        value={formData.endereco}
                                        onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cidade</label>
                                        <Input
                                            placeholder="Sua cidade"
                                            value={formData.cidade}
                                            onChange={e => setFormData({ ...formData, cidade: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">UF</label>
                                        <select
                                            value={formData.uf}
                                            onChange={e => setFormData({ ...formData, uf: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                        >
                                            <option value="">...</option>
                                            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">CEP</label>
                                        <Input
                                            placeholder="00000-000"
                                            value={formData.cep}
                                            onChange={e => setFormData({ ...formData, cep: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <hr className="my-6 border-gray-200" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Complementares</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Estado Civil</label>
                                        <select
                                            value={formData.estado_civil}
                                            onChange={e => setFormData({ ...formData, estado_civil: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                        >
                                            <option value="">Selecione...</option>
                                            {ESTADOS_CIVIS.map(item => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cidade de Nascimento</label>
                                        <Input
                                            placeholder="Cidade onde nasceu"
                                            value={formData.naturalidade}
                                            onChange={e => setFormData({ ...formData, naturalidade: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">UF de Nascimento</label>
                                        <select
                                            value={formData.uf_nascimento}
                                            onChange={e => setFormData({ ...formData, uf_nascimento: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                        >
                                            <option value="">Selecione...</option>
                                            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Escolaridade</label>
                                        <select
                                            value={formData.escolaridade}
                                            onChange={e => setFormData({ ...formData, escolaridade: e.target.value })}
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                                        >
                                            <option value="">Selecione...</option>
                                            {ESCOLARIDADE.map(item => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Profissão</label>
                                        <Input
                                            placeholder="Sua profissão"
                                            value={formData.profissao}
                                            onChange={e => setFormData({ ...formData, profissao: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cargo na Igreja</label>
                                        <Input
                                            placeholder="Cargo ou função"
                                            value={formData.cargo_igreja}
                                            onChange={e => setFormData({ ...formData, cargo_igreja: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Congregação</label>
                                        <Input
                                            placeholder="Nome da congregação"
                                            value={formData.congregacao}
                                            onChange={e => setFormData({ ...formData, congregacao: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <hr className="my-6 border-gray-200" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Origem Acadêmica</h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 block">
                                            Já estudou Teologia?
                                        </label>
                                        <div className="flex gap-4 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="estudou_teologia"
                                                    checked={!formData.ja_estudou_teologia}
                                                    onChange={() => setFormData({ ...formData, ja_estudou_teologia: false, instituicao_teologia: '' })}
                                                    className="h-4 w-4 text-blue-600"
                                                />
                                                <span className="text-sm">Nunca Estudei Teologia</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="estudou_teologia"
                                                    checked={formData.ja_estudou_teologia}
                                                    onChange={() => setFormData({ ...formData, ja_estudou_teologia: true })}
                                                    className="h-4 w-4 text-blue-600"
                                                />
                                                <span className="text-sm">Sim, já estudei Teologia</span>
                                            </label>
                                        </div>
                                    </div>

                                    {formData.ja_estudou_teologia && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Instituição que Estudou</label>
                                            <Input
                                                placeholder="Nome da instituição ou seminário"
                                                value={formData.instituicao_teologia}
                                                onChange={e => setFormData({ ...formData, instituicao_teologia: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <hr className="my-6 border-gray-200" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Acadêmicas</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Subnúcleo Atual</label>
                                        <select
                                            disabled
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                                            value={formData.subnucleo_id}
                                        >
                                            {subnucleos.map(s => (
                                                <option key={s.id} value={s.id}>{s.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nível Acadêmico</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                            value={formData.nivel_id}
                                            onChange={e => setFormData({ ...formData, nivel_id: e.target.value })}
                                        >
                                            {niveis.map(n => (
                                                <option key={n.id} value={n.id}>{n.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={isSaving}>
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    )
}

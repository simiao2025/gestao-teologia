'use client'

import React, { useState, useEffect } from 'react'
import Layout from '@/components/layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
    User, Mail, Phone, MapPin, CreditCard, ChevronLeft,
    Calendar, GraduationCap, Map, Clock, Edit
} from 'lucide-react'
import Link from 'next/link'
import { formatDate, maskCpf, maskPhone } from '@/lib/utils'

export default function VisualizarAlunoPage({ params }: { params: { id: string } }) {
    const { user, handleLogout } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [aluno, setAluno] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [params.id])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const { data, error } = await supabase
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
                    criado_em,
                    usuarios!id (
                        nome,
                        email,
                        telefone
                    ),
                    subnucleos (
                        nome,
                        cidade,
                        estado
                    ),
                    niveis!nivel_atual_id (
                        nome
                    )
                `)
                .eq('id', params.id)
                .single()

            if (error) throw error
            setAluno(data)

        } catch (error: any) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <Layout title="Visualizar Aluno" user={user} onLogout={handleLogout}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </Layout>
        )
    }

    if (!aluno) {
        return (
            <Layout title="Aluno Não Encontrado" user={user} onLogout={handleLogout}>
                <div className="text-center py-12">
                    <p className="text-gray-500">O aluno solicitado não foi encontrado.</p>
                    <Button asChild className="mt-4" variant="outline">
                        <Link href="/dashboard/alunos">Voltar</Link>
                    </Button>
                </div>
            </Layout>
        )
    }

    const usuario = Array.isArray(aluno.usuarios) ? aluno.usuarios[0] : aluno.usuarios
    const subnucleo = Array.isArray(aluno.subnucleos) ? aluno.subnucleos[0] : aluno.subnucleos
    const nivel = Array.isArray(aluno.niveis) ? aluno.niveis[0] : aluno.niveis

    const DetailItem = ({ icon: Icon, label, value }: any) => (
        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="mt-1">
                <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="text-base font-medium text-gray-900 mt-0.5">{value || '-'}</p>
            </div>
        </div>
    )

    return (
        <Layout title="Visualizar Aluno" user={user} onLogout={handleLogout}>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center mb-6 print:hidden">
                    <Button variant="outline" size="sm" asChild className="rounded-full flex items-center gap-1">
                        <Link href="/dashboard/alunos">
                            <ChevronLeft className="h-4 w-4" />
                            Voltar
                        </Link>
                    </Button>

                    <Button asChild>
                        <Link href={`/dashboard/alunos/${params.id}/editar`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Dados
                        </Link>
                    </Button>
                </div>

                {/* Header Profile */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                    <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold uppercase ring-4 ring-white shadow-lg">
                        {usuario?.nome?.substring(0, 2) || 'AL'}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-2xl font-bold text-gray-900">{usuario?.nome}</h1>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            <Badge variant="outline" className="text-sm px-3 py-1">
                                {subnucleo?.nome || 'Sem Subnúcleo'}
                            </Badge>
                            <Badge className={`text-sm px-3 py-1 ${aluno.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {aluno.status?.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-500 flex items-center justify-center md:justify-start gap-1">
                            <Clock className="h-3 w-3" />
                            Matriculado em {formatDate(aluno.criado_em)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Pessoais</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem icon={Mail} label="Email" value={usuario?.email} />
                            <DetailItem icon={Phone} label="Telefone" value={maskPhone(usuario?.telefone)} />
                            <DetailItem icon={CreditCard} label="CPF" value={maskCpf(aluno.cpf)} />
                            <DetailItem icon={CreditCard} label="RG" value={aluno.rg} />
                            <DetailItem icon={Calendar} label="Data de Nascimento" value={aluno.data_nascimento ? formatDate(aluno.data_nascimento).split(' ')[0] : '-'} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Complementares</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem icon={User} label="Estado Civil" value={aluno.estado_civil} />
                            <DetailItem icon={Map} label="Naturalidade" value={`${aluno.naturalidade || ''} - ${aluno.uf_nascimento || ''}`} />
                            <DetailItem icon={GraduationCap} label="Escolaridade" value={aluno.escolaridade} />
                            <DetailItem icon={User} label="Profissão" value={aluno.profissao} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Eclesiásticos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem icon={User} label="Cargo na Igreja" value={aluno.cargo_igreja} />
                            <DetailItem icon={Home} label="Congregação" value={aluno.congregacao} />
                            <DetailItem
                                icon={GraduationCap}
                                label="Já estudou Teologia?"
                                value={aluno.ja_estudou_teologia ? `Sim (${aluno.instituicao_teologia})` : 'Não'}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Acadêmicos & Endereço</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <DetailItem icon={GraduationCap} label="Nível Atual" value={nivel?.nome} />
                            <DetailItem icon={Map} label="Subnúcleo" value={`${subnucleo?.nome || ''} - ${subnucleo?.cidade || ''}/${subnucleo?.estado || ''}`} />
                            <DetailItem icon={MapPin} label="Endereço" value={aluno.endereco} />
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem icon={Map} label="Cidade/UF" value={`${aluno.cidade || ''} - ${aluno.estado || ''}`} />
                                <DetailItem icon={MapPin} label="CEP" value={aluno.cep} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    )
}

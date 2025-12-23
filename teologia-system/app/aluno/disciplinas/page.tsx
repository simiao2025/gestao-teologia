'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { BookOpen, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Helper for status badge colors (move to a util if reused often)
const getStatusBadge = (status: string) => {
    switch (status) {
        case 'aprovado':
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprovado</Badge>
        case 'reprovado':
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Reprovado</Badge>
        case 'cursando':
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Cursando</Badge>
        case 'pendente':
        default:
            return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pendente</Badge>
    }
}

export default function StudentDisciplinesPage() {
    const [loading, setLoading] = useState(true)
    const [disciplines, setDisciplines] = useState<any[]>([])
    const [subnucleoName, setSubnucleoName] = useState<string>('')
    const [monitorsList, setMonitorsList] = useState<string[]>([])
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    const checkSession = useCallback(async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }

        // Buscar ID do banco para garantir consistência
        let dbUid = session.user.id;
        const { data: usuario } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', session.user.email)
            .maybeSingle()

        if (usuario) dbUid = usuario.id;

        setUser(session.user)
        loadDisciplines(dbUid)
    }, [router])

    useEffect(() => {
        checkSession()
    }, [checkSession])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const loadDisciplines = async (userId: string) => {
        try {
            setLoading(true)

            // 1. Tentar buscar dados do aluno via tabela de usuarios (relação 1:1)
            let subnucleoNomeInfo = ''
            let subnucleoIdInfo = ''

            // Busca via Usuario -> Alunos -> Subnucleos
            const { data: userData } = await supabase
                .from('usuarios')
                .select(`
                    id,
                    alunos (
                        id,
                        subnucleo_id,
                        subnucleos (nome)
                    )
                `)
                .eq('id', userId)
                .maybeSingle()

            if (userData?.alunos) {
                const aluno = Array.isArray(userData.alunos) ? userData.alunos[0] : userData.alunos
                if (aluno) {
                    subnucleoIdInfo = aluno.subnucleo_id
                    const sub = Array.isArray(aluno.subnucleos) ? aluno.subnucleos[0] : aluno.subnucleos
                    subnucleoNomeInfo = sub?.nome || ''
                }
            }

            setSubnucleoName(subnucleoNomeInfo || '')

            // 2. Buscar disciplinas (Query Limpa sem Join problemático com alunos)
            const { data: disciplinasData, error: discError } = await supabase
                .from('alunos_disciplinas')
                .select(`
                  *,
                  disciplinas (
                    id,
                    nome,
                    codigo,
                    descricao,
                    niveis (
                      nome
                    )
                  )
                `)
                .eq('aluno_id', userId)
                .order('criado_em', { ascending: false })

            if (discError) throw discError

            let finalData = disciplinasData || []

            // 3. Buscar monitores considerando o histórico de subnúcleos
            if (finalData.length > 0) {
                // Coletar todos os IDs de subnúcleo relevantes (do histórico ou do atual)
                const subnucleoIds = new Set<string>()

                if (subnucleoIdInfo) subnucleoIds.add(subnucleoIdInfo)

                finalData.forEach(item => {
                    if (item.subnucleo_id) {
                        subnucleoIds.add(item.subnucleo_id)
                    }
                })

                const uniqueSubIds = Array.from(subnucleoIds)
                const disciplinaIds = finalData.map(d => d.disciplina_id)

                let escalasData: any[] = []

                if (uniqueSubIds.length > 0) {
                    const { data: escalas } = await supabase
                        .from('escalas_monitores')
                        .select(`
                            disciplina_id,
                            subnucleo_id,
                            monitor:usuarios!monitor_id(nome)
                        `)
                        .in('subnucleo_id', uniqueSubIds)
                        .in('disciplina_id', disciplinaIds)

                    if (escalas) escalasData = escalas
                }

                // Criar mapa composto: Chave = "SubID_DiscID" -> NomeMonitor
                const monitorMap: Record<string, string> = {}

                escalasData?.forEach((escala: any) => {
                    if (escala.monitor?.nome) {
                        // Chave composta para garantir unicidade por subnúcleo
                        const key = `${escala.subnucleo_id}_${escala.disciplina_id}`
                        monitorMap[key] = escala.monitor.nome
                    }
                })

                // Anexar info ao array final
                finalData = finalData.map(item => {
                    // Determinar qual subnúcleo usar para este item
                    const targetSubId = item.subnucleo_id || subnucleoIdInfo
                    const key = `${targetSubId}_${item.disciplina_id}`

                    return {
                        ...item,
                        monitorNome: monitorMap[key] || 'Não definido'
                    }
                })
            }

            setDisciplines(finalData)
        } catch (error) {
            console.error('Error loading disciplines:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando disciplinas...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Minhas Disciplinas</h1>
                    <p className="text-gray-600">Acompanhe seu progresso acadêmico</p>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                </Button>
            </div>

            {/* Info Section - Subnúcleo */}
            {subnucleoName && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Seu Subnúcleo</span>
                    <span className="text-lg font-bold text-gray-900">{subnucleoName}</span>
                </div>
            )}

            <Card>
                <CardContent className="p-0">
                    {disciplines.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-500">Disciplina</th>
                                        <th className="text-left p-4 font-medium text-gray-500">Nível</th>
                                        <th className="text-center p-4 font-medium text-gray-500">N1</th>
                                        <th className="text-center p-4 font-medium text-gray-500">N2</th>
                                        <th className="text-center p-4 font-medium text-gray-500">N3</th>
                                        <th className="text-center p-4 font-medium text-gray-500">N4</th>
                                        <th className="text-center p-4 font-medium text-gray-500">N5</th>
                                        <th className="text-center p-4 font-medium text-gray-500">Média</th>
                                        <th className="text-center p-4 font-medium text-gray-500">Recup.</th>
                                        <th className="text-right p-4 font-medium text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {disciplines.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4">
                                                <div className="text-xs font-medium text-blue-600 mb-1">
                                                    Monitor: {item.monitorNome}
                                                </div>
                                                <div className="font-medium text-gray-900">{item.disciplinas?.nome}</div>
                                                <div className="text-xs text-gray-500 font-mono uppercase">{item.disciplinas?.codigo}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {item.disciplinas?.niveis?.nome || 'N/A'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-center text-sm">{item.nota1 !== null ? Number(item.nota1).toFixed(1) : '-'}</td>
                                            <td className="p-4 text-center text-sm">{item.nota2 !== null ? Number(item.nota2).toFixed(1) : '-'}</td>
                                            <td className="p-4 text-center text-sm">{item.nota3 !== null ? Number(item.nota3).toFixed(1) : '-'}</td>
                                            <td className="p-4 text-center text-sm">{item.nota4 !== null ? Number(item.nota4).toFixed(1) : '-'}</td>
                                            <td className="p-4 text-center text-sm">{item.nota5 !== null ? Number(item.nota5).toFixed(1) : '-'}</td>
                                            <td className="p-4 text-center font-bold">
                                                {item.media_final !== null ? (
                                                    <span className={item.media_final >= 7 ? "text-green-600" : "text-amber-600"}>
                                                        {Number(item.media_final).toFixed(1)}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-center text-sm italic text-gray-500">
                                                {item.nota_recuperacao !== null ? Number(item.nota_recuperacao).toFixed(1) : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                {getStatusBadge(item.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">Você ainda não está matriculado em nenhuma disciplina.</p>
                            <p className="text-sm text-gray-400 mt-2">Entre em contato com a secretaria para realizar sua matrícula.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

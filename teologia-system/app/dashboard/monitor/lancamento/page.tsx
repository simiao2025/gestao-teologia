'use client'

import React, { useState, useEffect } from 'react'
import { supabase, EscalaMonitor, AlunoDisciplina } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Loader2,
    Save,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    Search,
    RefreshCw,
    ChevronLeft
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'

interface StudentGrading extends AlunoDisciplina {
    aluno: {
        nome: string;
        cpf: string;
    }
}

export default function MonitorGradingPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [escalas, setEscalas] = useState<(EscalaMonitor & { subnucleo: any, disciplina: any })[]>([])
    const [escalaSelecionada, setEscalaSelecionada] = useState<string>('')
    const [alunos, setAlunos] = useState<StudentGrading[]>([])

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
        if (user) {
            loadEscalas()
        }
    }, [user])

    useEffect(() => {
        if (escalaSelecionada) {
            loadAlunos()
        }
    }, [escalaSelecionada])

    const loadEscalas = async () => {
        try {
            const { data, error } = await supabase
                .from('escalas_monitores')
                .select(`
                    *,
                    subnucleo:subnucleo_id(nome, id),
                    disciplina:disciplina_id(nome, id, codigo)
                `)
                .eq('monitor_id', user?.id)

            if (error) throw error
            setEscalas(data as any)
            if (data.length > 0) {
                setEscalaSelecionada(data[0].id)
            } else {
                setLoading(false)
            }
        } catch (error: any) {
            console.error('Erro ao carregar escalas:', error)
            showFeedback('Erro', 'Não foi possível carregar suas escalas de monitor.', 'error')
            setLoading(false)
        }
    }

    const loadAlunos = async () => {
        setLoading(true)
        try {
            const escala = escalas.find(e => e.id === escalaSelecionada)
            if (!escala) return

            // 1. Buscar alunos vinculados ao subnúcleo desta escala
            const { data: vinculos, error: vError } = await supabase
                .from('alunos')
                .select('id, nome, cpf')
                .eq('subnucleo_id', escala.subnucleo_id)

            if (vError) throw vError
            if (!vinculos || vinculos.length === 0) {
                setAlunos([])
                return
            }

            const alunoIds = vinculos.map(a => a.id)

            // 2. Buscar registros de alunos_disciplinas para esses alunos na disciplina da escala
            const { data: notas, error: nError } = await supabase
                .from('alunos_disciplinas')
                .select('*')
                .eq('disciplina_id', escala.disciplina_id)
                .in('aluno_id', alunoIds)

            if (nError) throw nError

            // Mapear dados
            const merged = (notas || []).map(nota => {
                const alunoInfo = vinculos.find(a => a.id === nota.aluno_id)
                return {
                    ...nota,
                    aluno: alunoInfo
                }
            }) as StudentGrading[]

            setAlunos(merged)
        } catch (error: any) {
            console.error('Erro ao carregar alunos:', error)
            showFeedback('Erro ao Carregar', 'Houve um problema ao buscar a lista de alunos.', 'error')
        } finally {
            setLoading(false)
        }
    }

    const calculateMedia = (a: StudentGrading) => {
        const n1 = Number(a.nota1) || 0
        const n2 = Number(a.nota2) || 0
        const n3 = Number(a.nota3) || 0
        const n4 = Number(a.nota4) || 0
        const n5 = Number(a.nota5) || 0
        return (n1 + n2 + n3 + n4 + n5) / 5
    }

    const getResultadoParcial = (media: number) => {
        if (media >= 7) return 'APROVADO'
        return 'RECUPERAÇÃO'
    }

    const getResultadoFinal = (a: StudentGrading) => {
        const media = calculateMedia(a)
        if (media >= 7) return 'APROVADO'

        const recuperacao = Number(a.nota_recuperacao) || 0
        if (recuperacao >= 7) return 'APROVADO'
        if (recuperacao > 0) return 'REPROVADO'

        return 'AGUARDANDO'
    }

    const handleUpdateNota = (alunoId: string, field: string, value: string) => {
        const numValue = value === '' ? null : parseFloat(value.replace(',', '.'))

        setAlunos(prev => prev.map(a => {
            if (a.aluno_id === alunoId) {
                const updated = { ...a, [field]: numValue }
                // Atualizar media_final localmente para feedback visual imediato
                updated.media_final = calculateMedia(updated)
                return updated
            }
            return a
        }))
    }

    const handleSaveNotas = async () => {
        setSaving(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            const updates = alunos.map(a => {
                const media = calculateMedia(a)
                const resFinal = getResultadoFinal(a)

                // Determinar status final para o banco
                let status: AlunoDisciplina['status'] = a.status
                if (resFinal === 'APROVADO') status = 'aprovado'
                else if (resFinal === 'REPROVADO') status = 'reprovado'

                return {
                    id: a.id,
                    nota1: a.nota1,
                    nota2: a.nota2,
                    nota3: a.nota3,
                    nota4: a.nota4,
                    nota5: a.nota5,
                    nota_recuperacao: a.nota_recuperacao,
                    media_final: media,
                    status: status,
                    data_conclusao: status === 'aprovado' ? new Date().toISOString() : a.data_conclusao
                }
            })

            // Upsert serial para garantir integridade e simplicidade no debug
            for (const update of updates) {
                const { error } = await supabase
                    .from('alunos_disciplinas')
                    .update(update)
                    .eq('id', update.id)

                if (error) throw error
            }

            showFeedback('Sucesso!', 'Todas as notas foram salvas e processadas com sucesso.', 'success')
            loadAlunos() // Recarregar para garantir sincronia
        } catch (error: any) {
            console.error('Erro ao salvar notas:', error)
            showFeedback('Erro ao Salvar', 'Falha ao salvar notas: ' + error.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    if (loading && escalas.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const currentEscala = escalas.find(e => e.id === escalaSelecionada)

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild className="rounded-full flex items-center gap-1">
                        <Link href="/dashboard">
                            <ChevronLeft className="h-4 w-4" /> Voltar
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <GraduationCap className="h-7 w-7 text-blue-600" />
                            Lançamento de Notas
                        </h1>
                        <p className="text-muted-foreground">Gerencie o desempenho acadêmico dos seus alunos.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Label className="hidden md:inline whitespace-nowrap">Escala Ativa:</Label>
                    <Select value={escalaSelecionada} onValueChange={setEscalaSelecionada}>
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue placeholder="Selecione sua escala..." />
                        </SelectTrigger>
                        <SelectContent>
                            {escalas.map(e => (
                                <SelectItem key={e.id} value={e.id}>
                                    {e.subnucleo?.nome} - {e.disciplina?.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={loadAlunos}>
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <FeedbackDialog
                isOpen={feedback.isOpen}
                onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                title={feedback.title}
                message={feedback.message}
                type={feedback.type}
            />

            {escalas.length === 0 ? (
                <Card className="bg-amber-50 border-amber-200 border-dashed border-2 shadow-sm">
                    <CardContent className="py-16 flex flex-col items-center text-center">
                        <div className="p-4 bg-amber-100 rounded-full mb-6">
                            <AlertCircle className="h-12 w-12 text-amber-600" />
                        </div>
                        <h3 className="text-xl font-bold text-amber-900">Nenhuma escala ativa em seu nome</h3>
                        <p className="text-amber-700 max-w-lg mx-auto mt-2 leading-relaxed">
                            Identificamos que você ainda não possui disciplinas ou polos vinculados ao seu perfil de monitor neste semestre.
                        </p>
                        <p className="text-amber-600 font-medium mt-4">
                            Por favor, verifique com a secretaria ou diretoria acadêmica para realizar seu cadastro nas escalas de monitoria.
                        </p>
                        <Button
                            variant="outline"
                            className="mt-8 border-amber-300 text-amber-700 hover:bg-amber-100"
                            asChild
                        >
                            <Link href="/dashboard">Ir para a Página Inicial</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="shadow-xl border-t-4 border-t-blue-600 overflow-hidden">
                    <CardHeader className="bg-blue-50/30 border-b">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-1">
                                <CardTitle className="text-blue-900">
                                    {currentEscala?.disciplina?.nome}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2">
                                    <Badge variant="secondary" className="font-mono">{currentEscala?.disciplina?.codigo}</Badge>
                                    <span className="text-foreground font-semibold">Polo: {currentEscala?.subnucleo?.nome}</span>
                                </CardDescription>
                            </div>
                            <Button
                                onClick={handleSaveNotas}
                                disabled={saving || alunos.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 h-11 px-6 shadow-md shadow-blue-200"
                            >
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Salvar Todas as Notas
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-600 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-bold sticky left-0 bg-slate-50 z-10 border-r">Aluno</th>
                                        <th className="px-3 py-4 font-bold text-center">Nota 1</th>
                                        <th className="px-3 py-4 font-bold text-center">Nota 2</th>
                                        <th className="px-3 py-4 font-bold text-center">Nota 3</th>
                                        <th className="px-3 py-4 font-bold text-center">Nota 4</th>
                                        <th className="px-3 py-4 font-bold text-center">Nota 5</th>
                                        <th className="px-4 py-4 font-bold text-center bg-slate-100">Média</th>
                                        <th className="px-4 py-4 font-bold text-center">Status Parcial</th>
                                        <th className="px-4 py-4 font-bold text-center">Recuperação</th>
                                        <th className="px-6 py-4 font-bold text-right">Resultado Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {alunos.map((a) => {
                                        const media = calculateMedia(a)
                                        const parcial = getResultadoParcial(media)
                                        const resFinal = getResultadoFinal(a)

                                        return (
                                            <tr key={a.id} className="hover:bg-blue-50/20 transition-colors group">
                                                <td className="px-6 py-4 font-medium sticky left-0 bg-white group-hover:bg-blue-50/20 z-10 border-r">
                                                    <div className="font-bold text-slate-800">{a.aluno?.nome}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{a.aluno?.cpf}</div>
                                                </td>
                                                {[1, 2, 3, 4, 5].map(nu => (
                                                    <td key={nu} className="px-2 py-4 text-center">
                                                        <Input
                                                            type="text"
                                                            className="h-9 w-16 mx-auto text-center font-bold focus:ring-2 focus:ring-blue-500"
                                                            value={(a as any)[`nota${nu}`] ?? ''}
                                                            onChange={(e) => handleUpdateNota(a.aluno_id, `nota${nu}`, e.target.value)}
                                                        />
                                                    </td>
                                                ))}
                                                <td className="px-4 py-4 text-center bg-slate-50/50">
                                                    <span className={cn(
                                                        "text-lg font-black",
                                                        media >= 7 ? "text-green-600" : "text-amber-600"
                                                    )}>
                                                        {media.toFixed(1).replace('.', ',')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <Badge
                                                        variant={parcial === 'APROVADO' ? 'default' : 'outline'}
                                                        className={cn(
                                                            "px-2 py-0.5 whitespace-nowrap",
                                                            parcial === 'APROVADO' ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : "bg-amber-50 text-amber-700 border-amber-200"
                                                        )}
                                                    >
                                                        {parcial}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <Input
                                                        type="text"
                                                        disabled={parcial === 'APROVADO'}
                                                        className={cn(
                                                            "h-9 w-16 mx-auto text-center font-bold",
                                                            parcial === 'APROVADO' ? "opacity-30 bg-gray-100" : "border-amber-400 focus:ring-amber-500"
                                                        )}
                                                        value={a.nota_recuperacao ?? ''}
                                                        onChange={(e) => handleUpdateNota(a.aluno_id, 'nota_recuperacao', e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Badge
                                                        className={cn(
                                                            "text-sm px-3 py-1 font-bold",
                                                            resFinal === 'APROVADO' ? "bg-green-600" :
                                                                resFinal === 'REPROVADO' ? "bg-red-600" :
                                                                    "bg-slate-400"
                                                        )}
                                                    >
                                                        {resFinal}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {alunos.length === 0 && !loading && (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-20 text-center text-muted-foreground italic">
                                                <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                Nenhum aluno com status "Cursando" encontrado para esta disciplina no seu polo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

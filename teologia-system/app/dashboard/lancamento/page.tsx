'use client'

import React, { useState, useEffect } from 'react'
import { supabase, EscalaMonitor, AlunoDisciplina } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Loader2,
    Save,
    CheckCircle2,
    AlertCircle,
    GraduationCap,
    Search,
    RefreshCw,
    ChevronLeft,
    Plus
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'
import { PageHeader } from '@/components/ui/page-header'
import Layout from '@/components/layout'

interface StudentGrading extends Omit<AlunoDisciplina, 'nota1' | 'nota2' | 'nota3' | 'nota4' | 'nota5' | 'nota_recuperacao' | 'media_final'> {
    nota1: string;
    nota2: string;
    nota3: string;
    nota4: string;
    nota5: string;
    nota_recuperacao: string;
    media_final: number;
    aluno: {
        nome: string;
        cpf: string;
        subnucleo_id: string;
        subnucleo_nome: string;
    };
    disciplina: {
        id: string;
        nome: string;
        codigo: string;
        nivel_id: string;
        nivel_nome: string;
    };
    monitor_nome?: string;
}

type HierarchicalData = {
    [nivel: string]: {
        [disciplina: string]: {
            [subnucleo: string]: {
                monitor: string;
                alunos: StudentGrading[];
            }
        }
    }
}

export default function MonitorGradingPage() {
    const { user, handleLogout } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [alunos, setAlunos] = useState<StudentGrading[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [diagnostics, setDiagnostics] = useState<{
        step1: number,
        step2: number,
        step3: number,
        step4: number
    }>({ step1: 0, step2: 0, step3: 0, step4: 0 })

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

    useEffect(() => {
        if (user) {
            loadAlunos()
        }
    }, [user])

    const showFeedback = (title: string, message: string, type: FeedbackType = 'info') => {
        setFeedback({ isOpen: true, title, message, type })
    }

    const formatDataForUI = (val: number | null | undefined): string => {
        if (val === null || val === undefined) return ''
        return val.toFixed(1).replace('.', ',')
    }

    const parseBrazilianNumber = (val: string): number | null => {
        if (!val || val.trim() === '') return null
        const sanitized = val.replace(',', '.')
        const num = parseFloat(sanitized)
        return isNaN(num) ? null : num
    }

    const loadAlunos = async () => {
        setLoading(true)
        try {
            // 1. Buscar todas as matrículas relevantes
            let query = supabase
                .from('alunos_disciplinas')
                .select(`
                    *,
                    disciplina:disciplinas!inner(
                        id, nome, codigo,
                        nivel:niveis!inner(id, nome)
                    ),
                    usuario:usuarios!inner(
                        nome,
                        aluno:alunos!inner(
                            cpf,
                            subnucleo:subnucleos!inner(
                                id, 
                                nome,
                                monitor:usuarios!monitor_id(nome)
                            )
                        )
                    )
                `)
                .in('status', ['cursando', 'recuperacao', 'aprovado', 'reprovado'])

            const { data: matriculas, error: mError } = await query
            if (mError) throw mError

            // 2. Buscar escalas de monitores (específicas por disciplina)
            const { data: escalasData } = await supabase
                .from('escalas_monitores')
                .select(`
                    subnucleo_id,
                    disciplina_id,
                    monitor:usuarios!monitor_id(nome)
                `)

            const formattedData = (matriculas || []).map(m => {
                const usuario = (m as any).usuario || {}
                const alunoBase = Array.isArray(usuario.aluno) ? usuario.aluno[0] : usuario.aluno
                const alunoInfo = alunoBase || {}
                const subnucleoInfo = alunoInfo.subnucleo || {}
                const disciplinaInfo = (m as any).disciplina || {}
                const nivelInfo = disciplinaInfo.nivel || {}

                // Tentar monitor da escala primeiro, senão monitor padrão do subnúcleo
                const escala = escalasData?.find(e =>
                    e.subnucleo_id === subnucleoInfo.id &&
                    e.disciplina_id === m.disciplina_id
                )

                const monitorNome = (escala?.monitor as any)?.nome ||
                    (subnucleoInfo.monitor as any)?.nome ||
                    'Não Atribuído'

                return {
                    ...m,
                    nota1: formatDataForUI(m.nota1),
                    nota2: formatDataForUI(m.nota2),
                    nota3: formatDataForUI(m.nota3),
                    nota4: formatDataForUI(m.nota4),
                    nota5: formatDataForUI(m.nota5),
                    nota_recuperacao: formatDataForUI(m.nota_recuperacao),
                    aluno: {
                        nome: usuario.nome || 'N/A',
                        cpf: alunoInfo.cpf || 'N/A',
                        subnucleo_id: alunoInfo.subnucleo_id,
                        subnucleo_nome: subnucleoInfo.nome || 'N/A'
                    },
                    disciplina: {
                        id: disciplinaInfo.id,
                        nome: disciplinaInfo.nome,
                        codigo: disciplinaInfo.codigo,
                        nivel_id: nivelInfo.id,
                        nivel_nome: nivelInfo.nome || 'N/A'
                    },
                    monitor_nome: monitorNome
                }
            }) as StudentGrading[]

            setAlunos(formattedData)
            setDiagnostics({
                step1: formattedData.length,
                step2: [...new Set(formattedData.map(a => a.aluno.subnucleo_id))].length,
                step3: [...new Set(formattedData.map(a => a.disciplina.id))].length,
                step4: formattedData.length
            })

        } catch (error: any) {
            console.error('Erro loadAlunos:', error)
            showFeedback('Erro', 'Erro ao carregar dados: ' + error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const formatNota = (val: any) => {
        if (val === null || val === undefined || val === '') return ''
        const num = typeof val === 'string' ? parseBrazilianNumber(val) : val
        if (num === null || isNaN(num as number)) return ''
        return (num as number).toFixed(1).replace('.', ',')
    }

    const calculateMedia = (a: StudentGrading) => {
        const n1 = parseBrazilianNumber(a.nota1) || 0
        const n2 = parseBrazilianNumber(a.nota2) || 0
        const n3 = parseBrazilianNumber(a.nota3) || 0
        const n4 = parseBrazilianNumber(a.nota4) || 0
        const n5 = parseBrazilianNumber(a.nota5) || 0
        const soma = n1 + n2 + n3 + n4 + n5
        return Math.round((soma / 5) * 10) / 10
    }

    const getResultadoParcial = (media: number) => {
        if (media >= 7.0) return 'APROVADO'
        return 'RECUPERAÇÃO'
    }

    const getResultadoFinal = (a: StudentGrading) => {
        const media = calculateMedia(a)
        const recuperacao = parseBrazilianNumber(a.nota_recuperacao) || 0

        if (media >= 7.0) return 'APROVADO'
        if (recuperacao >= 7.0) return 'APROVADO'
        if (recuperacao > 0 && recuperacao < 7.0) return 'REPROVADO'

        return 'AGUARDANDO'
    }

    const groupData = (data: StudentGrading[]): HierarchicalData => {
        const filtered = data.filter(a =>
            a.aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.aluno.cpf.includes(searchTerm)
        )

        const grouped: HierarchicalData = {}
        filtered.forEach(a => {
            const n = a.disciplina.nivel_nome
            const d = a.disciplina.nome
            const s = a.aluno.subnucleo_nome

            if (!grouped[n]) grouped[n] = {}
            if (!grouped[n][d]) grouped[n][d] = {}
            if (!grouped[n][d][s]) grouped[n][d][s] = { monitor: a.monitor_nome || 'N/A', alunos: [] }

            grouped[n][d][s].alunos.push(a)
        })
        return grouped
    }

    const groupedAlunos = groupData(alunos)

    const handleSaveNotas = async () => {
        setSaving(true)
        try {
            const updates = alunos.map(a => {
                const media = calculateMedia(a)
                const parcial = getResultadoParcial(media)
                const resFinal = getResultadoFinal(a)

                let status: AlunoDisciplina['status'] = a.status
                if (resFinal === 'APROVADO') status = 'aprovado'
                else if (resFinal === 'REPROVADO') status = 'reprovado'
                else if (parcial === 'RECUPERAÇÃO') status = 'recuperacao'

                return {
                    id: a.id,
                    nota1: parseBrazilianNumber(a.nota1),
                    nota2: parseBrazilianNumber(a.nota2),
                    nota3: parseBrazilianNumber(a.nota3),
                    nota4: parseBrazilianNumber(a.nota4),
                    nota5: parseBrazilianNumber(a.nota5),
                    nota_recuperacao: parseBrazilianNumber(a.nota_recuperacao),
                    media_final: media,
                    status: status,
                    data_conclusao: status === 'aprovado' ? new Date().toISOString() : (a as any).data_conclusao
                }
            })

            for (const update of updates) {
                const { error } = await supabase
                    .from('alunos_disciplinas')
                    .update(update)
                    .eq('id', update.id)
                if (error) throw error
            }

            showFeedback('Sucesso!', 'Todas as notas foram salvas com sucesso.', 'success')
            loadAlunos()
        } catch (error: any) {
            console.error('Erro ao salvar notas:', error)
            showFeedback('Erro ao Salvar', 'Falha ao salvar notas: ' + error.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateNota = (id: string, field: string, value: string) => {
        let digits = value.replace(/\D/g, '')
        digits = digits.slice(0, 3)

        let masked = digits
        if (digits.length === 2) {
            masked = digits.charAt(0) + ',' + digits.charAt(1)
        } else if (digits.length === 3) {
            if (digits === '100') {
                masked = '10,0'
            } else {
                masked = digits.slice(0, 2) + ',' + digits.charAt(2)
            }
        }

        setAlunos(prev => prev.map(a => {
            if (a.id === id) {
                return { ...a, [field]: masked }
            }
            return a
        }))
    }

    if (loading && alunos.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <Layout user={user} onLogout={handleLogout}>
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
                <PageHeader
                    title="Lançamento de Notas"
                    description="Gerencie o desempenho acadêmico dos seus alunos de forma hierárquica."
                    icon={GraduationCap}
                    backHref="/dashboard"
                    actions={
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar aluno..."
                                    className="pl-9 w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleSaveNotas}
                                disabled={saving || alunos.length === 0}
                                className="bg-blue-600 hover:bg-blue-700 font-bold"
                            >
                                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Salvar Todas as Notas
                            </Button>
                            <Button variant="outline" size="icon" onClick={loadAlunos} disabled={loading}>
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                        </div>
                    }
                />

                <FeedbackDialog
                    isOpen={feedback.isOpen}
                    onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                    title={feedback.title}
                    message={feedback.message}
                    type={feedback.type}
                />

                {(user?.tipo === 'admin' || user?.tipo === 'diretoria') && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-100 rounded-lg border border-slate-200">
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Alunos no Polo</p>
                            <p className="text-xl font-bold text-slate-800">{diagnostics.step1}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Pólos Diferentes</p>
                            <p className="text-xl font-bold text-slate-800">{diagnostics.step2}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Disciplinas</p>
                            <p className="text-xl font-bold text-slate-800">{diagnostics.step3}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase font-bold text-slate-500">Total Matrículas</p>
                            <p className="text-xl font-bold text-blue-600">{diagnostics.step4}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-12">
                    {Object.keys(groupedAlunos).length > 0 ? (
                        Object.entries(groupedAlunos).sort().map(([nivel, disciplinas]) => (
                            <div key={nivel} className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-200">
                                    <Badge className="bg-slate-800 text-white uppercase px-3 py-1">{nivel}</Badge>
                                    <div className="h-0.5 flex-1 bg-slate-100"></div>
                                </div>

                                {Object.entries(disciplinas).sort().map(([discNome, subnucleos]) => (
                                    <div key={discNome} className="ml-4 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                            <h2 className="text-xl font-bold text-slate-800">{discNome}</h2>
                                        </div>

                                        {Object.entries(subnucleos).sort().map(([subNome, info]) => (
                                            <div key={subNome} className="ml-6 space-y-4">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Subnúcleo:</span>
                                                        <span className="font-semibold text-slate-700">{subNome}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Monitor:</span>
                                                        <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 font-bold">
                                                            {info.monitor}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="grid gap-4">
                                                    {info.alunos.sort((a, b) => a.aluno.nome.localeCompare(b.aluno.nome)).map((a) => {
                                                        const media = calculateMedia(a)
                                                        const parcial = getResultadoParcial(media)
                                                        const resFinal = getResultadoFinal(a)

                                                        return (
                                                            <Card key={a.id} className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                                                                <CardHeader className="bg-muted/10 pb-3">
                                                                    <div className="flex justify-between items-center">
                                                                        <div>
                                                                            <CardTitle className="text-base">{a.aluno?.nome}</CardTitle>
                                                                            <CardDescription className="text-[10px]">
                                                                                CPF: {a.aluno?.cpf}
                                                                            </CardDescription>
                                                                        </div>
                                                                        <Badge
                                                                            className={cn(
                                                                                "text-[10px] font-bold px-2 py-0.5",
                                                                                resFinal === 'APROVADO' ? "bg-green-600" :
                                                                                    resFinal === 'REPROVADO' ? "bg-red-600" :
                                                                                        "bg-amber-500"
                                                                            )}
                                                                        >
                                                                            {resFinal}
                                                                        </Badge>
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="pt-4">
                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-3 items-end">
                                                                        {[1, 2, 3, 4, 5].map(n => (
                                                                            <div key={n} className="space-y-1">
                                                                                <Label className="text-[9px] uppercase font-bold text-muted-foreground">Nota {n}</Label>
                                                                                <Input
                                                                                    type="text"
                                                                                    className="h-8 text-center font-bold text-sm px-1"
                                                                                    value={(a as any)[`nota${n}`] ?? ''}
                                                                                    placeholder="0,0"
                                                                                    onChange={(e) => handleUpdateNota(a.id, `nota${n}`, e.target.value)}
                                                                                />
                                                                            </div>
                                                                        ))}

                                                                        <div className="space-y-1 bg-slate-50 p-1.5 rounded-lg border border-dashed border-slate-200">
                                                                            <Label className="text-[9px] uppercase font-bold text-blue-600">Média</Label>
                                                                            <div className={cn(
                                                                                "text-base font-black text-center h-8 flex items-center justify-center",
                                                                                media >= 7.0 ? "text-green-600" : "text-amber-600"
                                                                            )}>
                                                                                {formatNota(media)}
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-1">
                                                                            <Label className="text-[9px] uppercase font-bold text-muted-foreground">Recup.</Label>
                                                                            <Input
                                                                                type="text"
                                                                                disabled={parcial === 'APROVADO'}
                                                                                className={cn(
                                                                                    "h-8 text-center font-bold text-sm px-1",
                                                                                    parcial === 'APROVADO' ? "bg-muted/50 border-none" : "border-amber-400 focus:ring-amber-500"
                                                                                )}
                                                                                value={a.nota_recuperacao ?? ''}
                                                                                placeholder="0,0"
                                                                                onChange={(e) => handleUpdateNota(a.id, 'nota_recuperacao', e.target.value)}
                                                                            />
                                                                        </div>

                                                                        <div className="space-y-1 bg-slate-50 p-1.5 rounded-lg border border-dashed border-slate-200">
                                                                            <Label className="text-[9px] uppercase font-bold text-slate-500">Res. Parcial</Label>
                                                                            <div className={cn(
                                                                                "text-[9px] font-black text-center h-8 flex items-center justify-center leading-tight",
                                                                                parcial === 'APROVADO' ? "text-green-600" : "text-amber-600"
                                                                            )}>
                                                                                {parcial}
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-1 bg-slate-50 p-1.5 rounded-lg border border-dashed border-slate-200">
                                                                            <Label className="text-[9px] uppercase font-bold text-slate-500">Res. Final</Label>
                                                                            <div className={cn(
                                                                                "text-[9px] font-black text-center h-8 flex items-center justify-center leading-tight",
                                                                                resFinal === 'APROVADO' ? "text-green-600" : resFinal === 'REPROVADO' ? "text-red-600" : "text-slate-400"
                                                                            )}>
                                                                                {resFinal}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ))
                    ) : (
                        !loading && (
                            <Card className="border-dashed border-2 bg-muted/20">
                                <CardContent className="py-20 text-center">
                                    <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <h3 className="text-lg font-medium text-muted-foreground">Nenhum aluno encontrado</h3>
                                    <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto mt-1">
                                        Não encontramos registros para os critérios informados.
                                    </p>
                                </CardContent>
                            </Card>
                        )
                    )}
                </div>
            </div>
        </Layout>
    )
}

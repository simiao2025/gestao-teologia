'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '@/components/layout'
import { supabase, ConfigSistema, Disciplina, Usuario, Subnucleo, EscalaMonitor } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/components/theme-provider'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Settings,
    Users,
    BookOpen,
    Palette,
    Globe,
    Download,
    Shield,
    Save,
    Loader2,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    ShoppingCart,
    ChevronLeft,
    Eye,
    EyeOff,
    Pencil,
    CalendarDays
} from 'lucide-react'

export default function ConfigSettingsPage() {
    const { user, handleLogout } = useAuth()
    const { setTheme } = useTheme()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState<ConfigSistema | null>(null)
    const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
    const [disciplinasLocal, setDisciplinasLocal] = useState<Disciplina[]>([])
    const [niveis, setNiveis] = useState<{ id: string, nome: string }[]>([])
    const [usuariosAdmin, setUsuariosAdmin] = useState<Usuario[]>([])

    // Novo Estado de Feedback
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

    const [academicSaving, setAcademicSaving] = useState(false)

    // Estados para Escalas de Monitores
    const [subnucleos, setSubnucleos] = useState<Subnucleo[]>([])
    const [escalas, setEscalas] = useState<(EscalaMonitor & { monitor: any, subnucleo: any, disciplina: any })[]>([])
    const [escalaSaving, setEscalaSaving] = useState(false)
    const [novaEscala, setNovaEscala] = useState({
        monitor_id: '',
        subnucleo_id: '',
        disciplina_id: ''
    })

    // Estados para Novo/Editar Usuário
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [newUser, setNewUser] = useState({ nome: '', email: '', senha: '', tipo: 'monitor' })

    // Estados para Troca de Senha
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
    const [passSaving, setPassSaving] = useState(false)

    // Estados para Visibilidade de Credenciais
    const [showApiKey, setShowApiKey] = useState(false)
    const [showAccessToken, setShowAccessToken] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const { data: configData, error: cError } = await supabase.from('config_sistema').select('*').limit(1).maybeSingle()
            if (cError) {
                console.error('Erro ao buscar config:', cError)
            }
            if (configData) {
                setConfig(configData)
            } else {
                console.warn('Configuração inicial não encontrada no banco. Inicializando localmente.')
                setConfig({
                    nome_instituicao: 'Sistema Teologia',
                    tema: 'light'
                } as any)
            }

            const { data: nData } = await supabase.from('niveis').select('id, nome').order('ordem')
            if (nData) setNiveis(nData)

            const { data: discData } = await supabase
                .from('disciplinas')
                .select('*')
                .order('codigo', { ascending: true })
            if (discData) {
                setDisciplinas(discData)
                setDisciplinasLocal(discData.map(d => ({
                    ...d,
                    data_limite_pedido_raw: formatDateToBR(d.data_limite_pedido),
                    data_encerramento_raw: formatDateToBR(d.data_encerramento)
                })) as any)
            }

            const { data: userData } = await supabase
                .from('usuarios')
                .select('*')
                .order('nome', { ascending: true })
            if (userData) setUsuariosAdmin(userData)

            const { data: subData } = await supabase.from('subnucleos').select('*').order('nome')
            if (subData) setSubnucleos(subData)

            await loadEscalas()
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadEscalas = async () => {
        const { data, error } = await supabase
            .from('escalas_monitores')
            .select(`
                *,
                monitor:monitor_id(nome),
                subnucleo:subnucleo_id(nome),
                disciplina:disciplina_id(nome)
            `)
            .order('criado_em', { ascending: false })

        if (error) {
            console.error('Erro ao carregar escalas:', error)
        } else {
            setEscalas(data as any)
        }
    }

    const maskDate = (value: string) => {
        const v = value.replace(/\D/g, '').slice(0, 8);
        if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
        return v;
    }

    const formatDateToBR = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        if (dateStr.includes('T')) {
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return '';
                const d = String(date.getDate()).padStart(2, '0');
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const y = date.getFullYear();
                return `${d}/${m}/${y}`;
            } catch (e) { return ''; }
        } else {
            // Handle simple YYYY-MM-DD
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return `${parts[2].substring(0, 2)}/${parts[1]}/${parts[0]}`;
            }
            return '';
        }
    }

    const parseBRToISO = (brDate: string) => {
        if (!brDate) return null;
        const parts = brDate.replace(/\s/g, '').split('/');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts;
        if (y.length !== 4 || isNaN(parseInt(y))) return null;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const handleUpdateDisciplinaLocal = (id: string, updates: Partial<Disciplina>) => {
        setDisciplinasLocal(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
    }

    const handleSaveEscala = async () => {
        if (!novaEscala.monitor_id || !novaEscala.subnucleo_id || !novaEscala.disciplina_id) {
            showFeedback('Aviso', 'Preencha todos os campos da escala.', 'warning')
            return
        }

        setEscalaSaving(true)
        try {
            const { error } = await supabase
                .from('escalas_monitores')
                .insert([novaEscala])

            if (error) {
                if (error.code === '23505') throw new Error('Esta escala já existe.')
                throw error
            }

            showFeedback('Sucesso!', 'Escala criada com sucesso!', 'success')
            setNovaEscala({ monitor_id: '', subnucleo_id: '', disciplina_id: '' })
            loadEscalas()
        } catch (error: any) {
            showFeedback('Erro', error.message, 'error')
        } finally {
            setEscalaSaving(false)
        }
    }

    const handleDeleteEscala = async (id: string) => {
        if (!confirm('Deseja remover esta escala?')) return

        try {
            const { error } = await supabase.from('escalas_monitores').delete().eq('id', id)
            if (error) throw error
            showFeedback('Sucesso!', 'Escala removida com sucesso.', 'success')
            loadEscalas()
        } catch (error: any) {
            showFeedback('Erro', error.message, 'error')
        }
    }

    const handleSaveAcademicCycle = async () => {
        setAcademicSaving(true);
        try {
            const changed = [];

            for (const d of disciplinasLocal) {
                const original = disciplinas.find(orig => orig.id === d.id);
                if (!original) continue;

                let isoLimite = null;
                let isoEncerramento = null;

                if (d.status_acad === 'proximo_pedido') {
                    isoLimite = parseBRToISO((d as any).data_limite_pedido_raw || '');
                    // Evitar zerar se houver erro de digitação parcial
                    if (!isoLimite && original.data_limite_pedido) {
                        isoLimite = original.data_limite_pedido.substring(0, 10);
                    }
                }

                if (d.status_acad === 'finalizado') {
                    isoEncerramento = parseBRToISO((d as any).data_encerramento_raw || '');
                    if (!isoEncerramento && original.data_encerramento) {
                        isoEncerramento = original.data_encerramento.substring(0, 10);
                    }
                }

                const hasStatusChanged = d.status_acad !== original.status_acad;
                const origLimite = original.data_limite_pedido ? original.data_limite_pedido.substring(0, 10) : null;
                const origEncerramento = original.data_encerramento ? original.data_encerramento.substring(0, 10) : null;

                const hasLimiteChanged = isoLimite !== origLimite;
                const hasEncerramentoChanged = isoEncerramento !== origEncerramento;

                if (hasStatusChanged || hasLimiteChanged || hasEncerramentoChanged) {
                    changed.push({
                        id: d.id,
                        status_acad: d.status_acad,
                        data_limite_pedido: isoLimite,
                        data_encerramento: isoEncerramento
                    });
                }
            }

            if (changed.length === 0) {
                showFeedback('Informação', 'Nenhuma alteração detectada para salvar.', 'info');
                return;
            }

            for (const item of changed) {
                const { error } = await supabase
                    .from('disciplinas')
                    .update({
                        status_acad: item.status_acad,
                        data_limite_pedido: item.data_limite_pedido,
                        data_encerramento: item.data_encerramento
                    })
                    .eq('id', item.id);
                if (error) throw error;
            }

            await loadData();
            showFeedback('Sucesso!', `${changed.length} disciplina(s) atualizada(s) com sucesso.`, 'success');
        } catch (error: any) {
            console.error('Erro ao salvar ciclo:', error);
            showFeedback('Erro', 'Houve um problema ao atualizar os prazos.', 'error');
        } finally {
            setAcademicSaving(false);
        }
    }

    const handleSaveConfig = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e) e.preventDefault()
        if (!config || saving) return
        setSaving(true)
        try {
            const payload = {
                nome_instituicao: config.nome_instituicao || 'Sistema Teologia',
                whatsapp_secretaria: config.whatsapp_secretaria || null,
                logo_url: config.logo_url || null,
                tema: config.tema || 'light',
                atualizado_em: new Date().toISOString()
            }
            let dbCall;
            if (config.id) {
                dbCall = supabase.from('config_sistema').update(payload).eq('id', config.id).select().single();
            } else {
                dbCall = supabase.from('config_sistema').insert([payload]).select().single();
            }
            const response = await dbCall;
            if (response.error) throw response.error;
            if (response.data) setConfig(response.data)
            loadData()
            showFeedback('Sucesso!', 'Configurações salvas com sucesso.', 'success')
        } catch (error: any) {
            showFeedback('Erro', error.message || 'Erro ao salvar as configurações.', 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário permanentemente? O acesso dele será revogado.')) return
        setSaving(true)
        try {
            const response = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' })
            if (!response.ok) {
                const result = await response.json()
                throw new Error((result.error || 'Erro ao excluir usuário'))
            }
            loadData()
            showFeedback('Sucesso!', 'Usuário excluído com sucesso.', 'success')
        } catch (error: any) {
            showFeedback('Erro', (error.message || 'Erro desconhecido'), 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveUser = async () => {
        if (!newUser.nome || !newUser.email || (!isEditing && !newUser.senha) || !newUser.tipo) {
            showFeedback('Dados Incompletos', 'Por favor, preencha todos os campos obrigatórios.', 'warning')
            return
        }
        if (!isEditing && newUser.senha.length < 6) {
            showFeedback('Senha Fraca', 'A senha deve ter no mínimo 6 caracteres.', 'warning')
            return
        }
        setSaving(true)
        try {
            const method = isEditing ? 'PATCH' : 'POST'
            const payload = isEditing ? { id: editingUserId, ...newUser } : newUser
            const response = await fetch('/api/usuarios', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error || 'Erro ao processar usuário')
            setIsUserModalOpen(false)
            setNewUser({ nome: '', email: '', senha: '', tipo: 'monitor' })
            setIsEditing(false)
            setEditingUserId(null)
            loadData()
            showFeedback('Sucesso!', isEditing ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!', 'success')
        } catch (error: any) {
            showFeedback('Erro no Cadastro', (error.message || 'Erro desconhecido'), 'error')
        } finally {
            setSaving(false)
        }
    }

    const handleEditClick = (u: Usuario) => {
        setNewUser({ nome: u.nome, email: u.email, senha: '', tipo: u.tipo })
        setEditingUserId(u.id)
        setIsEditing(true)
        setIsUserModalOpen(true)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwords.new !== passwords.confirm) {
            showFeedback('Senhas Não Coincidem', 'As senhas digitadas não coincidem!', 'warning')
            return
        }
        setPassSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: passwords.new })
            if (error) throw error
            showFeedback('Sucesso!', 'Senha atualizada com sucesso!', 'success')
            setPasswords({ current: '', new: '', confirm: '' })
        } catch (error: any) {
            showFeedback('Erro', 'Erro ao trocar senha: ' + error.message, 'error')
        } finally {
            setPassSaving(false)
        }
    }

    const exportData = (table: string) => {
        showFeedback('Funcionalidade em Desenvolvimento', `A funcionalidade de exportação para ${table} será implementada na Fase 2 completa!`, 'info')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <Layout user={user} onLogout={handleLogout}>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild className="rounded-full flex items-center gap-1">
                            <Link href="/dashboard">
                                <ChevronLeft className="h-4 w-4" /> Voltar
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configurações do Sistema</h1>
                            <p className="text-gray-500 font-medium">Gerencie diretrizes acadêmicas, permissões e identidade visual.</p>
                        </div>
                    </div>
                </div>

                <FeedbackDialog
                    isOpen={feedback.isOpen}
                    onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                    title={feedback.title}
                    message={feedback.message}
                    type={feedback.type}
                />

                <Tabs defaultValue={user?.tipo === 'monitor' ? 'perfil' : 'academico'} className="w-full">
                    <TabsList className={cn(
                        "grid mb-8 gap-1",
                        user?.tipo === 'monitor' ? "grid-cols-1 md:w-1/4" : "grid-cols-2 md:grid-cols-6"
                    )}>
                        {user?.tipo !== 'monitor' && (
                            <>
                                <TabsTrigger value="academico"><BookOpen className="h-4 w-4 mr-2" /> Ciclo</TabsTrigger>
                                <TabsTrigger value="escalas"><CalendarDays className="h-4 w-4 mr-2" /> Escalas</TabsTrigger>
                                <TabsTrigger value="usuarios"><Users className="h-4 w-4 mr-2" /> Usuários</TabsTrigger>
                                <TabsTrigger value="aparencia"><Palette className="h-4 w-4 mr-2" /> Visual</TabsTrigger>
                                <TabsTrigger value="ferramentas"><Download className="h-4 w-4 mr-2" /> Dados</TabsTrigger>
                            </>
                        )}
                        <TabsTrigger value="perfil"><Shield className="h-4 w-4 mr-2" /> Perfil</TabsTrigger>
                    </TabsList>

                    {/* --- Aba Ciclo Acadêmico --- */}
                    <TabsContent value="academico">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Gestão de Disciplinas & Prazos</CardTitle>
                                    <CardDescription>Configure o status e prazos para cada nível do curso.</CardDescription>
                                </div>
                                <Button
                                    onClick={handleSaveAcademicCycle}
                                    disabled={academicSaving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {academicSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Salvar Alterações
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {niveis.length > 0 ? niveis.map((nv) => (
                                    <div key={nv.id} className="mb-10 last:mb-0">
                                        <h3 className="text-lg font-bold mb-4 text-blue-700 flex items-center">Nível {nv.nome}</h3>
                                        <div className="border border-border rounded-xl overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-muted/50 border-b border-border">
                                                    <tr>
                                                        <th className="px-5 py-4 font-semibold text-foreground">Disciplina</th>
                                                        <th className="px-5 py-4 font-semibold text-foreground">Status Acadêmico</th>
                                                        <th className="px-5 py-4 font-semibold text-foreground">Data/Prazo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {disciplinasLocal.filter(d => d.nivel_id === nv.id).map((disc) => (
                                                        <tr key={disc.id} className="hover:bg-accent/30 transition-colors">
                                                            <td className="px-5 py-4">
                                                                <div className="font-bold text-foreground">{disc.nome}</div>
                                                                <div className="text-xs text-muted-foreground mt-0.5">{disc.codigo}</div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <Select
                                                                    value={disc.status_acad}
                                                                    onValueChange={(val: any) => handleUpdateDisciplinaLocal(disc.id, { status_acad: val })}
                                                                >
                                                                    <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="pendente">Pendente</SelectItem>
                                                                        <SelectItem value="proximo_pedido">Próximo Pedido</SelectItem>                                                                    <SelectItem value="ja_pedido">Já Pedido</SelectItem>
                                                                        <SelectItem value="finalizado">Finalizado</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {disc.status_acad === 'proximo_pedido' ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Prazo de Pedido</span>
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="DD/MM/AAAA"
                                                                            className="h-8 w-[140px] text-xs"
                                                                            value={(disc as any).data_limite_pedido_raw || ''}
                                                                            onChange={(e) => handleUpdateDisciplinaLocal(disc.id, { data_limite_pedido_raw: maskDate(e.target.value) } as any)}
                                                                        />
                                                                    </div>
                                                                ) : disc.status_acad === 'finalizado' ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] text-blue-500 uppercase font-bold">Encerrado em</span>
                                                                        <Input
                                                                            type="text"
                                                                            placeholder="DD/MM/AAAA"
                                                                            className="h-8 w-[140px] text-xs"
                                                                            value={(disc as any).data_encerramento_raw || ''}
                                                                            onChange={(e) => handleUpdateDisciplinaLocal(disc.id, { data_encerramento_raw: maskDate(e.target.value) } as any)}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400 italic">N/A</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-10 text-gray-500">Nenhum nível acadêmico encontrado.</div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- Aba Escalas --- */}
                    <TabsContent value="escalas">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle>Nova Escala</CardTitle>
                                    <CardDescription>Vincular monitor a um polo e disciplina.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Monitor</Label>
                                        <Select value={novaEscala.monitor_id} onValueChange={(v) => setNovaEscala({ ...novaEscala, monitor_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                {usuariosAdmin.filter(u => u.tipo === 'monitor').map(m => (
                                                    <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Polo (Subnúcleo)</Label>
                                        <Select value={novaEscala.subnucleo_id} onValueChange={(v) => setNovaEscala({ ...novaEscala, subnucleo_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                {subnucleos.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Disciplina</Label>
                                        <Select value={novaEscala.disciplina_id} onValueChange={(v) => setNovaEscala({ ...novaEscala, disciplina_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                            <SelectContent>
                                                {disciplinas.map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.nome} ({d.codigo})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleSaveEscala} disabled={escalaSaving} className="w-full bg-blue-600 hover:bg-blue-700">
                                        {escalaSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                        Criar Escala
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Escalas Ativas</CardTitle>
                                    <CardDescription>Monitores escalados por polo e disciplina.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-xl overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted/50 border-b">
                                                <tr>
                                                    <th className="px-4 py-3 font-semibold">Monitor</th>
                                                    <th className="px-4 py-3 font-semibold">Polo</th>
                                                    <th className="px-4 py-3 font-semibold">Disciplina</th>
                                                    <th className="px-4 py-3 font-semibold w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y text-gray-600">
                                                {escalas.map((esc) => (
                                                    <tr key={esc.id} className="hover:bg-muted/30">
                                                        <td className="px-4 py-3 font-medium text-foreground">{esc.monitor?.nome}</td>
                                                        <td className="px-4 py-3">{esc.subnucleo?.nome}</td>
                                                        <td className="px-4 py-3">{esc.disciplina?.nome}</td>
                                                        <td className="px-4 py-3">
                                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteEscala(esc.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* --- Aba Usuários --- */}
                    <TabsContent value="usuarios">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Gestão de Usuários</CardTitle>
                                    <CardDescription>Gerencie o acesso de administradores, monitores e alunos.</CardDescription>
                                </div>
                                <Button size="sm" onClick={() => {
                                    setIsEditing(false)
                                    setNewUser({ nome: '', email: '', senha: '', tipo: 'monitor' })
                                    setIsUserModalOpen(true)
                                }}>
                                    <UserPlus className="h-4 w-4 mr-2" /> Novo Usuário
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    {usuariosAdmin.map((u) => (
                                        <div key={u.id} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                    {u.nome.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{u.nome}</div>
                                                    <div className="text-sm text-gray-500">{u.email}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline" className="capitalize">{u.tipo}</Badge>
                                                <Button variant="ghost" size="icon" className="text-blue-500" onClick={() => handleEditClick(u)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteUser(u.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- Aba Aparência --- */}
                    <TabsContent value="aparencia">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personalização</CardTitle>
                                <CardDescription>Adapte o visual do sistema para sua instituição.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Label>Nome da Instituição</Label>
                                        <Input
                                            value={config?.nome_instituicao || ''}
                                            onChange={(e) => setConfig(prev => prev ? ({ ...prev, nome_instituicao: e.target.value }) : null)}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Tema Padrão</Label>
                                        <div className="flex gap-4">
                                            <div onClick={() => { setConfig(prev => prev ? ({ ...prev, tema: 'light' }) : null); setTheme('light') }} className={cn("flex-1 p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all", config?.tema === 'light' || !config?.tema ? "border-blue-500 bg-blue-50/50" : "hover:border-gray-400 opacity-60")}>
                                                <div className="w-full h-12 bg-white border rounded shadow-sm"></div>
                                                <span className="text-xs font-bold">Light Mode</span>
                                            </div>
                                            <div onClick={() => { setConfig(prev => prev ? ({ ...prev, tema: 'dark' }) : null); setTheme('dark') }} className={cn("flex-1 p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-all", config?.tema === 'dark' ? "border-blue-500 bg-blue-50/50" : "hover:border-gray-400 opacity-60")}>
                                                <div className="w-full h-12 bg-gray-900 border rounded shadow-sm"></div>
                                                <span className="text-xs font-bold">Dark Mode</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={() => handleSaveConfig()} disabled={saving} className="px-8">
                                        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Salvar Alterações
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* --- Aba Perfil (Segurança) --- */}
                    <TabsContent value="perfil">
                        <Card>
                            <CardHeader>
                                <CardTitle>Meus Dados & Segurança</CardTitle>
                                <CardDescription>Gerencie suas credenciais de acesso.</CardDescription>
                            </CardHeader>
                            <CardContent className="max-w-xl">
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Seu Nome</Label>
                                                <Input value={user?.user_metadata?.nome || ''} disabled className="bg-muted" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Seu E-mail</Label>
                                                <Input value={user?.email || ''} disabled className="bg-muted" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t space-y-4">
                                        <h4 className="font-bold flex items-center text-red-600"><Shield className="h-4 w-4 mr-2" /> Alterar Senha</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Nova Senha</Label>
                                                <Input type="password" placeholder="Mínimo 6 caracteres" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Confirmar Nova Senha</Label>
                                                <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} />
                                            </div>
                                        </div>
                                        <Button type="submit" variant="destructive" disabled={passSaving} className="w-full">
                                            {passSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Atualizar Senha
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="ferramentas">
                        <Card>
                            <CardHeader><CardTitle>Exportação de Dados</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button variant="outline" className="h-16 justify-start px-6" onClick={() => exportData('alunos')}>
                                    <Users className="h-5 w-5 mr-4 text-blue-500" /> Exportar Alunos (Excel/CSV)
                                </Button>
                                <Button variant="outline" className="h-16 justify-start px-6" onClick={() => exportData('pedidos')}>
                                    <ShoppingCart className="h-5 w-5 mr-4 text-green-500" /> Exportar Pedidos (Excel/CSV)
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Modal Novo/Editar Usuário */}
                <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                            <DialogDescription>Preencha os dados do {isEditing ? 'usuário' : 'novo membro'}.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input value={newUser.nome} onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>E-mail</Label>
                                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} disabled={isEditing} />
                            </div>
                            <div className="space-y-2">
                                <Label>Senha {isEditing && '(Opcional)'}</Label>
                                <Input type="password" value={newUser.senha} onChange={(e) => setNewUser({ ...newUser, senha: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo / Permissão</Label>
                                <Select value={newUser.tipo} onValueChange={(val: any) => setNewUser({ ...newUser, tipo: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aluno">Aluno</SelectItem>
                                        <SelectItem value="monitor">Monitor</SelectItem>
                                        <SelectItem value="diretoria">Diretoria</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSaveUser} disabled={saving}>
                                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                {isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    )
}

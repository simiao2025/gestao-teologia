'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase, Disciplina } from '@/lib/supabase'
import { Clock, AlertTriangle, BookOpen, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StudentBannerProps {
    alunoId: string
}

export function StudentBanner({ alunoId }: StudentBannerProps) {
    const [activeDisc, setActiveDisc] = useState<Disciplina | null>(null)
    const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [isExpired, setIsExpired] = useState(false)

    const calculateTimeLeft = useCallback((deadline: string) => {
        const difference = +new Date(deadline) - +new Date()
        if (difference <= 0) return null

        return {
            d: Math.floor(difference / (1000 * 60 * 60 * 24)),
            h: Math.floor((difference / (1000 * 60 * 60)) % 24),
            m: Math.floor((difference / 1000 / 60) % 60),
            s: Math.floor((difference / 1000) % 60)
        }
    }, [])

    const [whatsappNumber, setWhatsappNumber] = useState('')

    useEffect(() => {
        async function fetchActiveCycle() {
            try {
                // 1. Get student status and level_id directly
                const { data: aluno } = await supabase
                    .from('alunos')
                    .select('status, nivel_atual_id')
                    .eq('id', alunoId)
                    .maybeSingle()

                if (!aluno || aluno.status !== 'ativo') {
                    setLoading(false)
                    return
                }

                if (!aluno?.nivel_atual_id) return

                // 2. Get WhatsApp Config
                const { data: config } = await supabase
                    .from('config_sistema')
                    .select('whatsapp_secretaria')
                    .maybeSingle()

                if (config?.whatsapp_secretaria) setWhatsappNumber(config.whatsapp_secretaria.replace(/\D/g, ''))

                // 3. Get discipline with 'proximo_pedido' status for this nivel_id
                const { data: disc } = await supabase
                    .from('disciplinas')
                    .select('*')
                    .eq('nivel_id', aluno.nivel_atual_id)
                    .eq('status_acad', 'proximo_pedido')
                    .maybeSingle()

                if (disc) {
                    // 4. Verify if student already COMPLETED this discipline (Approved)
                    const { data: alreadyDone } = await supabase
                        .from('alunos_disciplinas')
                        .select('status')
                        .eq('aluno_id', alunoId)
                        .eq('disciplina_id', disc.id)
                        .eq('status', 'aprovado')
                        .maybeSingle()

                    if (alreadyDone) {
                        // Student is already approved, hide banner
                        setActiveDisc(null)
                        setLoading(false)
                        return
                    }

                    setActiveDisc(disc)
                    if (disc.data_limite_pedido) {
                        const initialTime = calculateTimeLeft(disc.data_limite_pedido)
                        setTimeLeft(initialTime)
                        setIsExpired(!initialTime)
                    }
                }
            } catch (err) {
                console.error('Error fetching student banner data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchActiveCycle()
    }, [alunoId, calculateTimeLeft])

    useEffect(() => {
        if (!activeDisc?.data_limite_pedido || isExpired) return

        const timer = setInterval(() => {
            const time = calculateTimeLeft(activeDisc.data_limite_pedido!)
            if (!time) {
                setIsExpired(true)
                setTimeLeft(null)
                clearInterval(timer)
            } else {
                setTimeLeft(time)
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [activeDisc, calculateTimeLeft, isExpired])

    if (loading || !activeDisc) return null

    return (
        <Card className={`overflow-hidden border-none shadow-lg ${isExpired ? 'bg-red-50' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center">
                    {/* Icon/Decoration */}
                    <div className={`p-6 hidden md:flex items-center justify-center ${isExpired ? 'bg-red-100 text-red-600' : 'bg-white/10 text-white'}`}>
                        {isExpired ? <AlertTriangle size={48} /> : <Clock size={48} className="animate-pulse" />}
                    </div>

                    <div className="flex-1 p-6 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                            <Badge className={isExpired ? 'bg-red-200 text-red-700 hover:bg-red-200' : 'bg-blue-400/30 text-white border-white/20'}>
                                {isExpired ? 'PRAZO ENCERRADO' : 'FAÇA SEU PEDIDO'}
                            </Badge>
                            <h2 className={`text-xl font-bold ${isExpired ? 'text-red-900' : 'text-white'}`}>
                                Próxima Disciplina: {activeDisc.nome}
                            </h2>
                        </div>

                        {!isExpired && timeLeft ? (
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <div className="text-white">
                                    <span className="text-2xl font-black block leading-none">{String(timeLeft.d).padStart(2, '0')}</span>
                                    <span className="text-[10px] uppercase font-bold opacity-70">Dias</span>
                                </div>
                                <div className="text-white text-2xl font-black">:</div>
                                <div className="text-white">
                                    <span className="text-2xl font-black block leading-none">{String(timeLeft.h).padStart(2, '0')}</span>
                                    <span className="text-[10px] uppercase font-bold opacity-70">Horas</span>
                                </div>
                                <div className="text-white text-2xl font-black">:</div>
                                <div className="text-white">
                                    <span className="text-2xl font-black block leading-none">{String(timeLeft.m).padStart(2, '0')}</span>
                                    <span className="text-[10px] uppercase font-bold opacity-70">Min</span>
                                </div>
                                <div className="text-white text-2xl font-black md:hidden lg:block">:</div>
                                <div className="text-white md:hidden lg:block">
                                    <span className="text-2xl font-black block leading-none">{String(timeLeft.s).padStart(2, '0')}</span>
                                    <span className="text-[10px] uppercase font-bold opacity-70">Seg</span>
                                </div>
                                <div className="ml-4 pl-4 border-l border-white/20 hidden lg:block">
                                    <p className="text-white/80 text-sm italic">O prazo encerra em {new Date(activeDisc.data_limite_pedido!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}h</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-red-700 font-medium">Infelizmente o prazo para pedido de material desta disciplina já encerrou.</p>
                                <Button size="sm" variant="destructive" className="bg-red-600 hover:bg-red-700 font-bold" asChild>
                                    <a href={`https://wa.me/${whatsappNumber || '5500000000000'}`} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="w-4 h-4 mr-2" /> Falar com Secretaria
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>

                    {!isExpired && (
                        <div className="p-6">
                            <Button size="lg" className="bg-white text-blue-700 hover:bg-gray-100 font-bold shadow-xl px-8" asChild>
                                <a href="/aluno/financeiro">Pedir Agora</a>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

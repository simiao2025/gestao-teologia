'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestEmailPage() {
    const [email, setEmail] = useState('')
    const [log, setLog] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])

    const handleTest = async () => {
        if (!email) return alert('Digite um email')
        setLoading(true)
        setLog([])
        addLog('Iniciando teste...')

        try {
            addLog(`Tentando enviar Magic Link para: ${email}`)
            addLog(`Redirect URL: ${window.location.origin}/auth/callback`)

            const { data, error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (error) {
                addLog(`❌ ERRO: ${error.message}`)
                addLog(`Detalhes: ${JSON.stringify(error)}`)
            } else {
                addLog('✅ SUCESSO: Supabase retornou 200 OK.')
                addLog('Dados retorno: ' + JSON.stringify(data))
                addLog('Verifique sua caixa de entrada e SPAM.')
            }

        } catch (err: any) {
            addLog(`❌ EXCEÇÃO: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Diagnóstico de Email (Supabase)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Digite o email para teste"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <Button onClick={handleTest} disabled={loading}>
                            {loading ? 'Enviando...' : 'Testar Envio'}
                        </Button>
                    </div>

                    <div className="bg-slate-900 text-green-400 p-4 rounded-md font-mono text-sm min-h-[200px] whitespace-pre-wrap">
                        {log.length === 0 ? 'Aguardando teste...' : log.join('\n')}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

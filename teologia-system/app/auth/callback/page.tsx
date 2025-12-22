'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthCallbackPage() {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleAuthCallback = useCallback(async () => {
        try {
            console.log('Starting auth callback...')

            // Tentar extrair access_token da URL manualmente
            const hash = window.location.hash
            console.log('URL hash:', hash)

            // Verificar se há erro na URL
            if (hash && hash.includes('error=access_denied')) {
                const params = new URLSearchParams(hash.substring(1))
                const errorCode = params.get('error_code')
                const errorDescription = params.get('error_description')

                console.error('Magic link error:', errorCode, errorDescription)

                if (errorCode === 'otp_expired') {
                    setError('O link de acesso expirou. Solicite um novo link de acesso.')
                } else {
                    setError(`Erro no link de acesso: ${errorDescription || 'Erro desconhecido'}`)
                }
                return
            }

            if (hash && hash.includes('access_token')) {
                console.log('Found access_token in URL hash')

                // Extrair parâmetros do hash
                const params = new URLSearchParams(hash.substring(1))
                const accessToken = params.get('access_token')
                const refreshToken = params.get('refresh_token')

                console.log('Access token:', accessToken ? 'found' : 'not found')
                console.log('Refresh token:', refreshToken ? 'found' : 'not found')

                if (accessToken) {
                    // Tentar setar a sessão manualmente
                    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken || ''
                    })

                    console.log('Set session result:', sessionData)
                    console.log('Set session error:', sessionError)

                    if (sessionError) {
                        console.error('Error setting session:', sessionError)
                        setError('Erro na autenticação. O link pode ter expirado.')
                        return
                    }

                    if (!sessionData?.user) {
                        console.error('No user found after setting session')
                        setError('Não foi possível autenticar. Tente solicitar um novo link.')
                        return
                    }

                    console.log('Found authenticated user:', sessionData.user.email)

                    // Verificar tipo do usuário na tabela usuarios
                    // Primeiro tentamos por ID (padrão Supabase)
                    let { data: userData, error: userError } = await supabase
                        .from('usuarios')
                        .select('id, tipo')
                        .eq('id', sessionData.user.id)
                        .maybeSingle()

                    // Se não encontrar por ID, tentamos por email (caso tenha sido criado via RPC)
                    if (!userData && !userError) {
                        console.log('User not found by ID, trying by email:', sessionData.user.email)
                        const { data: byEmail, error: emailError } = await supabase
                            .from('usuarios')
                            .select('id, tipo')
                            .eq('email', sessionData.user.email)
                            .maybeSingle()

                        if (byEmail) {
                            console.log('Found user by email. Bridging ID from', byEmail.id, 'to', sessionData.user.id)

                            try {
                                // Antes de atualizar o ID do usuário, precisamos garantir que as tabelas filhas (como 'alunos')
                                // possam ser atualizadas. Se não houver CASCADE, isso falhará.
                                const { error: updateError } = await supabase
                                    .from('usuarios')
                                    .update({ id: sessionData.user.id })
                                    .eq('id', byEmail.id)

                                if (updateError) {
                                    console.error('Error bridging user ID:', updateError)
                                    if (updateError.code === '23503') {
                                        console.warn('Foreign key constraint violation. Manual SQL intervention required (see fix_database_schema.sql).')
                                        // Prosseguimos com o ID antigo por enquanto para não travar o login totalmente
                                        userData = byEmail
                                    } else {
                                        userData = byEmail
                                    }
                                } else {
                                    console.log('ID bridged successfully')
                                    userData = { id: sessionData.user.id, tipo: byEmail.tipo }
                                }
                            } catch (e) {
                                console.error('Unexpected error during bridging:', e)
                                userData = byEmail
                            }
                        } else {
                            userError = emailError
                        }
                    }

                    console.log('Final user data for redirect:', userData)

                    if (userError) {
                        console.error('Error checking user type:', userError)
                        setError('Erro ao verificar tipo de usuário.')
                        return
                    }

                    if (!userData || !userData.tipo) {
                        console.error('Invalid user data:', userData)
                        setError('Seus dados não foram encontrados no sistema acadêmico. Por favor, entre em contato com o suporte ou complete sua matrícula.')
                        return
                    }

                    // Redirecionar baseado no tipo de usuário
                    if (userData.tipo === 'aluno') {
                        console.log('Redirecting to student area')
                        // Usar replace para evitar voltar para o callback
                        // Adicionando welcome=true para acionar alertas de primeiro acesso
                        router.replace('/aluno?welcome=true')
                    } else {
                        console.log('Redirecting to admin dashboard')
                        router.replace('/dashboard')
                    }
                } else {
                    console.error('No access token found in URL parameters')
                    setError('Link de acesso inválido ou expirado.')
                }
            } else {
                console.error('No access_token found in URL')
                setError('Link de acesso inválido ou expirado.')
            }
        } catch (error) {
            console.error('Error in auth callback:', error)
            setError('Erro interno durante a autenticação.')
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        handleAuthCallback()
    }, [handleAuthCallback])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Autenticando...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="text-center py-8">
                        <div className="text-red-600 mb-4">
                            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Erro na Autenticação</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => window.location.href = '/recuperar-senha'}
                                className="w-full"
                            >
                                Solicitar Novo Link
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => window.location.href = '/'}
                                className="w-full"
                            >
                                Voltar para Página Inicial
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardContent className="text-center py-8">
                    <div className="text-green-600 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Autenticação Concluída!</h2>
                    <p className="text-gray-600">Redirecionando para sua área...</p>
                </CardContent>
            </Card>
        </div>
    )
}

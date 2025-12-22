'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function AdminLoginForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setError('')

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            })

            if (authError) {
                setError(authError.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authError.message)
                return
            }

            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('nome, tipo')
                .eq('email', data.email)
                .maybeSingle()

            if (userError || !userData) {
                setError('Usuário não encontrado no sistema.')
                return
            }

            if (!['admin', 'diretoria', 'monitor'].includes(userData.tipo)) {
                setError('Acesso negado. Esta área é restrita para administradores.')
                await supabase.auth.signOut()
                return
            }

            router.push('/dashboard')
        } catch (error) {
            setError('Erro interno do servidor')
            console.error('Erro no login admin:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
            {/* Abstract Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

            <div className="max-w-md w-full z-10">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-white rounded-2xl shadow-2xl shadow-indigo-500/10 ring-1 ring-white/10">
                            <Image
                                src="/icons/Logo-EETAD.png"
                                alt="Logo EETAD"
                                width={80}
                                height={80}
                                className="h-16 w-auto"
                            />
                        </div>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                        Painel Administrativo
                    </h2>
                    <p className="text-slate-400 text-sm">
                        EETAD - Núcleo Palmas
                    </p>
                </div>

                <Card className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-white text-xl">Identifique-se</CardTitle>
                        <CardDescription className="text-slate-400">
                            Gerenciamento e controle do sistema
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="px-4 py-3 rounded-lg text-sm bg-red-900/20 border border-red-800/50 text-red-400 animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
                                    Email Institucional
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@teologia.edu.br"
                                    {...register('email')}
                                    className={`bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 focus:ring-indigo-500/50 ${errors.email ? 'border-red-500' : ''}`}
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">
                                    Senha de Acesso
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        {...register('password')}
                                        className={`bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 focus:ring-indigo-500/50 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-600 hover:text-white transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Autenticando...' : 'Acessar Painel'}
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                            <Link
                                href="/login"
                                className="text-xs text-slate-500 hover:text-indigo-400 transition-colors inline-flex items-center gap-2 group"
                            >
                                Sou aluno, ir para o Portal do Estudante
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-xs text-slate-600 hover:text-slate-400 transition-colors gap-2"
                    >
                        <ArrowLeft className="h-3 w-3" /> Voltar para o site institucional
                    </Link>
                </div>
            </div>
        </div>
    )
}

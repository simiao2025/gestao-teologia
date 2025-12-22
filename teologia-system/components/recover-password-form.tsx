'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

const recoverSchema = z.object({
    email: z.string().email('Email inválido')
})

type RecoverFormData = z.infer<typeof recoverSchema>

export default function RecoverPasswordForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RecoverFormData>({
        resolver: zodResolver(recoverSchema)
    })

    const onSubmit = async (data: RecoverFormData) => {
        setIsLoading(true)
        setError('')

        try {
            const { error: authError } = await supabase.auth.signInWithOtp({
                email: data.email,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`
                }
            })

            if (authError) {
                setError(authError.message)
                return
            }

            setSuccess(true)
        } catch (error) {
            setError('Erro interno do servidor')
            console.error('Erro na recuperação:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full">
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="h-12 w-12 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Enviado!</h2>
                            <p className="text-gray-600 mb-6">
                                Verifique sua caixa de entrada. Enviamos um link de acesso para o seu email.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/login')}
                                className="w-full"
                            >
                                Voltar para o Login
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Recuperar Acesso
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Informe seu email para receber um link de acesso
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Enviar Link</CardTitle>
                        <CardDescription>
                            Você receberá um link mágico para acessar sua conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    {...register('email')}
                                    className={errors.email ? 'border-red-300' : ''}
                                />
                                {errors.email && (
                                    <p className="text-red-600 text-sm">{errors.email.message}</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Enviando...' : 'Enviar Link de Acesso'}
                            </Button>
                        </form>

                        <div className="mt-4 text-center">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/login')}
                                className="w-full flex items-center justify-center"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Voltar para o Login
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

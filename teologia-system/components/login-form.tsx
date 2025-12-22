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

export default function LoginForm() {
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
        setError('Usuário não encontrado. Se você é novo, conclua sua matrícula.')
        return
      }

      if (userData.tipo === 'aluno') {
        router.push('/aluno')
      } else {
        // Redireciona admins para o dashboard, mas avisa que essa é a área de alunos
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Erro interno do servidor')
      console.error('Erro no login aluno:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-blue-50/50 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-500/5 rounded-full blur-[100px]" />

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-white rounded-2xl shadow-xl shadow-blue-200 ring-4 ring-blue-50">
              <Image
                src="/icons/Logo-EETAD.png"
                alt="Logo EETAD"
                width={80}
                height={80}
                className="h-16 w-auto"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
            Portal do Aluno
          </h2>
          <p className="text-gray-600 text-sm">
            EETAD - Sistema Acadêmico
          </p>
        </div>

        <Card className="border-none shadow-2xl shadow-blue-900/10 rounded-3xl overflow-hidden bg-white/80 backdrop-blur-lg">
          <CardHeader className="bg-gradient-to-br from-blue-600 to-blue-700 text-white pt-8 pb-10">
            <CardTitle className="text-white text-2xl">Bem-vindo(a)!</CardTitle>
            <CardDescription className="text-blue-100/80">
              Acesse seus dados pessoais, materiais e financeiro
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-10 px-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="px-5 py-4 rounded-2xl text-sm bg-red-50 border border-red-100 text-red-600 animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">
                  Seu E-mail
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  {...register('email')}
                  className={`bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 rounded-2xl focus:ring-blue-500/20 transition-all ${errors.email ? 'border-red-300' : ''}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                <div className="flex justify-between items-center ml-1">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    Sua Senha
                  </label>
                  <Link href="/recuperar-senha" className="text-[10px] uppercase tracking-widest font-bold text-blue-600 hover:text-blue-700">
                    Esqueci a senha
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                    className={`bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 h-12 rounded-2xl focus:ring-blue-500/20 transition-all pr-12 ${errors.password ? 'border-red-300' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10 hover:bg-transparent text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 ml-1 font-medium">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Conectando...' : 'Entrar no Portal'}
              </Button>
            </form>

            <div className="mt-8 text-center flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500">
                Ainda não é aluno?{' '}
                <Link href="/matricula" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Comece aqui
                </Link>
              </p>

              <Link
                href="/"
                className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors gap-2"
              >
                <ArrowLeft className="h-3 w-3" /> Voltar para o site institucional
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

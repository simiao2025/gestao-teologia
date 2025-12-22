'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { matriculaSchema, type MatriculaFormData } from '@/lib/validations'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BookOpen, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import type { Subnucleo } from '@/lib/supabase'

interface MatriculaFormProps {
  onSuccess?: () => void
}

export default function MatriculaForm({ onSuccess }: MatriculaFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [subnucleos, setSubnucleos] = useState<Subnucleo[]>([])
  const [niveis, setNiveis] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<MatriculaFormData>({
    resolver: zodResolver(matriculaSchema)
  })

  // Carregar subnúcleos e níveis
  useEffect(() => {
    const fetchSubnucleos = async () => {
      const { data, error } = await supabase
        .from('subnucleos')
        .select('*')
        .order('nome')

      if (error) {
        console.error('Erro ao carregar subnúcleos:', error)
      } else {
        setSubnucleos(data || [])
      }
    }

    const fetchNiveis = async () => {
      const { data, error } = await supabase
        .from('niveis')
        .select('*')
        .order('ordem')

      if (error) {
        console.error('Erro ao carregar níveis:', error)
      } else {
        setNiveis(data || [])
      }
    }

    fetchSubnucleos()
    fetchNiveis()
  }, [])

  const onSubmit = async (data: MatriculaFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Validar CPF
      const cpf = data.cpf.replace(/\D/g, '')
      if (cpf.length !== 11) {
        setError('CPF deve ter 11 dígitos')
        return
      }

      // Criar usuário e aluno usando a função SQL
      const { data: result, error: createError } = await supabase
        .rpc('criar_aluno', {
          p_nome: data.nome,
          p_email: data.email,
          p_telefone: data.telefone,
          p_cpf: cpf,
          p_data_nascimento: data.data_nascimento,
          p_endereco: data.endereco,
          p_subnucleo_id: data.subnucleo_id,
          p_nivel_id: data.nivel_id
        })

      if (createError) {
        console.error('Erro ao criar aluno:', createError)
        if (createError.message?.includes('duplicate key') || createError.message?.includes('already exists')) {
          if (createError.message?.includes('email')) {
            setError('Este email já está cadastrado')
          } else if (createError.message?.includes('cpf')) {
            setError('Este CPF já está cadastrado')
          } else {
            setError('Dados já cadastrados no sistema')
          }
        } else {
          setError('Erro ao processar matrícula. Tente novamente.')
        }
        return
      }

      // Enviar magic link por email
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signInError) {
        console.error('Erro ao enviar magic link:', signInError)
        setError('Erro ao enviar link de acesso. Tente novamente.')
        return
      }

      setSuccess('Matrícula realizada com sucesso! Enviamos um link de acesso para seu email.')

      // Limpar formulário
      reset()

      setTimeout(() => {
        onSuccess?.()
      }, 3000)

    } catch (error) {
      setError('Erro interno do servidor')
      console.error('Erro na matrícula:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <BookOpen className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Matricule-se no Curso
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Preencha o formulário abaixo para se inscrever
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>
              Informe seus dados para realizar a matrícula
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              {/* Dados pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nome" className="text-sm font-medium text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    Nome Completo *
                  </label>
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    {...register('nome')}
                    className={errors.nome ? 'border-red-300' : ''}
                  />
                  {errors.nome && (
                    <p className="text-red-600 text-sm">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email *
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

                <div className="space-y-2">
                  <label htmlFor="telefone" className="text-sm font-medium text-gray-700 flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    Telefone *
                  </label>
                  <Input
                    id="telefone"
                    placeholder="(11) 99999-9999"
                    {...register('telefone')}
                    className={errors.telefone ? 'border-red-300' : ''}
                  />
                  {errors.telefone && (
                    <p className="text-red-600 text-sm">{errors.telefone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="data_nascimento" className="text-sm font-medium text-gray-700">
                    Data de Nascimento *
                  </label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    {...register('data_nascimento')}
                    className={errors.data_nascimento ? 'border-red-300' : ''}
                  />
                  {errors.data_nascimento && (
                    <p className="text-red-600 text-sm">{errors.data_nascimento.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="cpf" className="text-sm font-medium text-gray-700 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" />
                    CPF *
                  </label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    {...register('cpf')}
                    className={errors.cpf ? 'border-red-300' : ''}
                  />
                  {errors.cpf && (
                    <p className="text-red-600 text-sm">{errors.cpf.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="endereco" className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Endereço Completo *
                </label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, bairro, cidade, estado"
                  {...register('endereco')}
                  className={errors.endereco ? 'border-red-300' : ''}
                />
                {errors.endereco && (
                  <p className="text-red-600 text-sm">{errors.endereco.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="subnucleo_id" className="text-sm font-medium text-gray-700">
                  Subnúcleo *
                </label>
                <select
                  id="subnucleo_id"
                  {...register('subnucleo_id')}
                  className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${errors.subnucleo_id ? 'border-red-300' : ''
                    }`}
                >
                  <option value="">Selecione um subnúcleo</option>
                  {subnucleos.map((subnucleo) => (
                    <option key={subnucleo.id} value={subnucleo.id}>
                      {subnucleo.nome} - {subnucleo.cidade}/{subnucleo.estado}
                    </option>
                  ))}
                </select>
                {errors.subnucleo_id && (
                  <p className="text-red-600 text-sm">{errors.subnucleo_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="nivel_id" className="text-sm font-medium text-gray-700">
                  Nível Atual *
                </label>
                <select
                  id="nivel_id"
                  {...register('nivel_id')}
                  className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${errors.nivel_id ? 'border-red-300' : ''
                    }`}
                >
                  <option value="">Selecione um nível</option>
                  {niveis.map((nivel) => (
                    <option key={nivel.id} value={nivel.id}>
                      {nivel.nome}
                    </option>
                  ))}
                </select>
                {errors.nivel_id && (
                  <p className="text-red-600 text-sm">{errors.nivel_id.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = '/'}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-[2] bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Enviar Matrícula'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
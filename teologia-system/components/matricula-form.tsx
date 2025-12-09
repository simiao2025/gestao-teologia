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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<MatriculaFormData>({
    resolver: zodResolver(matriculaSchema)
  })

  // Carregar subnúcleos
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

    fetchSubnucleos()
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

      // Verificar se o email já existe
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', data.email)
        .single()

      if (existingUser) {
        setError('Este email já está cadastrado')
        return
      }

      // Verificar se o CPF já existe
      const { data: existingAluno } = await supabase
        .from('alunos')
        .select('cpf')
        .eq('cpf', cpf)
        .single()

      if (existingAluno) {
        setError('Este CPF já está cadastrado')
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
          p_subnucleo_id: data.subnucleo_id
        })

      if (createError) {
        console.error('Erro ao criar aluno:', createError)
        setError('Erro ao processar matrícula. Tente novamente.')
        return
      }

      setSuccess('Matrícula realizada com sucesso! Verifique seu email para acessar o sistema.')
      
      // Limpar formulário
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
                  className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${
                    errors.subnucleo_id ? 'border-red-300' : ''
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Processando...' : 'Confirmar Matrícula'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
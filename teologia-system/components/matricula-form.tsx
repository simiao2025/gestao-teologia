'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { matriculaSchema, type MatriculaFormData } from '@/lib/validations'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BookOpen, User, Mail, Phone, MapPin, CreditCard, Home, GraduationCap } from 'lucide-react'
import type { Subnucleo } from '@/lib/supabase'
import { ESTADOS_CIVIS, ESCOLARIDADE, UFS } from '@/constants/student'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'
import { useRouter } from 'next/navigation'

interface MatriculaFormProps {
  onSuccess?: () => void
}

export default function MatriculaForm({ onSuccess }: MatriculaFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [subnucleos, setSubnucleos] = useState<Subnucleo[]>([])
  const [niveis, setNiveis] = useState<any[]>([])

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

    try {
      // Validar CPF
      const cpf = data.cpf.replace(/\D/g, '')
      if (cpf.length !== 11) {
        showFeedback('Atenção', 'CPF deve ter 11 dígitos', 'warning')
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
          p_nivel_id: data.nivel_id,
          p_rg: data.rg,
          p_estado_civil: data.estado_civil,
          p_naturalidade: data.naturalidade,
          p_uf_nascimento: data.uf_nascimento,
          p_escolaridade: data.escolaridade,
          p_profissao: data.profissao,
          p_cargo_igreja: data.cargo_igreja,
          p_congregacao: data.congregacao,
          p_ja_estudou_teologia: data.ja_estudou_teologia,
          p_instituicao_teologia: data.ja_estudou_teologia ? data.instituicao_teologia : null
        })

      if (createError) {
        console.error('Erro ao criar aluno:', createError)
        if (createError.message?.includes('duplicate key') || createError.message?.includes('already exists')) {
          if (createError.message?.includes('email')) {
            showFeedback('Erro', 'Este email já está cadastrado', 'error')
          } else if (createError.message?.includes('cpf')) {
            showFeedback('Erro', 'Este CPF já está cadastrado', 'error')
          } else {
            showFeedback('Erro', 'Dados já cadastrados no sistema', 'error')
          }
        } else {
          showFeedback('Erro', 'Erro ao processar matrícula. Tente novamente.', 'error')
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
        showFeedback('Erro', 'Erro ao enviar link de acesso. Tente novamente.', 'error')
        return
      }

      showFeedback('Sucesso', 'Matrícula realizada com sucesso! Enviamos um link de acesso para seu email.', 'success')

      // Limpar formulário
      reset()
    } catch (error) {
      showFeedback('Erro', 'Erro interno do servidor', 'error')
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

        <FeedbackDialog
          isOpen={feedback.isOpen}
          onClose={() => {
            setFeedback(prev => ({ ...prev, isOpen: false }))
            if (feedback.type === 'success') {
              router.push('/')
            }
          }}
          title={feedback.title}
          message={feedback.message}
          type={feedback.type}
        />
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>
              Informe seus dados para realizar a matrícula
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

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

                <div className="space-y-2">
                  <label htmlFor="rg" className="text-sm font-medium text-gray-700 flex items-center">
                    <CreditCard className="h-4 w-4 mr-1" />
                    RG *
                  </label>
                  <Input
                    id="rg"
                    placeholder="Seu RG"
                    {...register('rg')}
                    className={errors.rg ? 'border-red-300' : ''}
                  />
                  {errors.rg && (
                    <p className="text-red-600 text-sm">{errors.rg.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="endereco" className="text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Endereço (Rua, Número, Bairro) *
                </label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, bairro"
                  {...register('endereco')}
                  className={errors.endereco ? 'border-red-300' : ''}
                />
                {errors.endereco && (
                  <p className="text-red-600 text-sm">{errors.endereco.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cidade" className="text-sm font-medium text-gray-700">
                    Cidade *
                  </label>
                  <Input
                    id="cidade"
                    placeholder="Sua cidade"
                    {...register('cidade')}
                    className={errors.cidade ? 'border-red-300' : ''}
                  />
                  {errors.cidade && (
                    <p className="text-red-600 text-sm">{errors.cidade.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="uf" className="text-sm font-medium text-gray-700">
                    UF *
                  </label>
                  <select
                    id="uf"
                    {...register('uf')}
                    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${errors.uf ? 'border-red-300' : ''}`}
                  >
                    <option value="">...</option>
                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  {errors.uf && (
                    <p className="text-red-600 text-sm">{errors.uf.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="cep" className="text-sm font-medium text-gray-700">
                    CEP *
                  </label>
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    {...register('cep')}
                    className={errors.cep ? 'border-red-300' : ''}
                  />
                  {errors.cep && (
                    <p className="text-red-600 text-sm">{errors.cep.message}</p>
                  )}
                </div>
              </div>

              <hr className="my-6 border-gray-200" />
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Complementares</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="estado_civil" className="text-sm font-medium text-gray-700">
                    Estado Civil *
                  </label>
                  <select
                    id="estado_civil"
                    {...register('estado_civil')}
                    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${errors.estado_civil ? 'border-red-300' : ''}`}
                  >
                    <option value="">Selecione...</option>
                    {ESTADOS_CIVIS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.estado_civil && (
                    <p className="text-red-600 text-sm">{errors.estado_civil.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="naturalidade" className="text-sm font-medium text-gray-700">
                    Cidade de Nascimento *
                  </label>
                  <Input
                    id="naturalidade"
                    placeholder="Cidade onde nasceu"
                    {...register('naturalidade')}
                    className={errors.naturalidade ? 'border-red-300' : ''}
                  />
                  {errors.naturalidade && (
                    <p className="text-red-600 text-sm">{errors.naturalidade.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="uf_nascimento" className="text-sm font-medium text-gray-700">
                    UF de Nascimento *
                  </label>
                  <select
                    id="uf_nascimento"
                    {...register('uf_nascimento')}
                    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${errors.uf_nascimento ? 'border-red-300' : ''}`}
                  >
                    <option value="">Selecione...</option>
                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  {errors.uf_nascimento && (
                    <p className="text-red-600 text-sm">{errors.uf_nascimento.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="escolaridade" className="text-sm font-medium text-gray-700">
                    Escolaridade *
                  </label>
                  <select
                    id="escolaridade"
                    {...register('escolaridade')}
                    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${errors.escolaridade ? 'border-red-300' : ''}`}
                  >
                    <option value="">Selecione...</option>
                    {ESCOLARIDADE.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                  {errors.escolaridade && (
                    <p className="text-red-600 text-sm">{errors.escolaridade.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="profissao" className="text-sm font-medium text-gray-700">
                    Profissão *
                  </label>
                  <Input
                    id="profissao"
                    placeholder="Sua profissão"
                    {...register('profissao')}
                    className={errors.profissao ? 'border-red-300' : ''}
                  />
                  {errors.profissao && (
                    <p className="text-red-600 text-sm">{errors.profissao.message}</p>
                  )}
                </div>
              </div>

              <hr className="my-6 border-gray-200" />
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Eclesiásticos</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cargo_igreja" className="text-sm font-medium text-gray-700">
                    Cargo na Igreja *
                  </label>
                  <Input
                    id="cargo_igreja"
                    placeholder="Cargo ou função"
                    {...register('cargo_igreja')}
                    className={errors.cargo_igreja ? 'border-red-300' : ''}
                  />
                  {errors.cargo_igreja && (
                    <p className="text-red-600 text-sm">{errors.cargo_igreja.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="congregacao" className="text-sm font-medium text-gray-700">
                    Congregação *
                  </label>
                  <Input
                    id="congregacao"
                    placeholder="Nome da congregação"
                    {...register('congregacao')}
                    className={errors.congregacao ? 'border-red-300' : ''}
                  />
                  {errors.congregacao && (
                    <p className="text-red-600 text-sm">{errors.congregacao.message}</p>
                  )}
                </div>
              </div>

              <hr className="my-6 border-gray-200" />
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Origem Acadêmica</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Já estudou Teologia? *
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="false"
                        {...register('ja_estudou_teologia', {
                          setValueAs: v => v === 'true'
                        })}
                        className="h-4 w-4 text-blue-600"
                        defaultChecked
                      />
                      <span className="text-sm">Nunca Estudei Teologia</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="true"
                        {...register('ja_estudou_teologia', {
                          setValueAs: v => v === 'true'
                        })}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">Sim, já estudei Teologia</span>
                    </label>
                  </div>
                </div>

                {watch('ja_estudou_teologia') && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label htmlFor="instituicao_teologia" className="text-sm font-medium text-gray-700">
                      Instituição que Estudou *
                    </label>
                    <Input
                      id="instituicao_teologia"
                      placeholder="Nome da instituição ou seminário"
                      {...register('instituicao_teologia')}
                      className={errors.instituicao_teologia ? 'border-red-300' : ''}
                    />
                    {errors.instituicao_teologia && (
                      <p className="text-red-600 text-sm">{errors.instituicao_teologia.message}</p>
                    )}
                  </div>
                )}
              </div>

              <hr className="my-6 border-gray-200" />
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Matrícula</h3>

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
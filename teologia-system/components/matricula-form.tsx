'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { matriculaSchema, type MatriculaFormData } from '@/lib/validations'
import { studentService } from '@/services/studentService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { BookOpen, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import type { Subnucleo, Nivel } from '@/types/student'
import { ESTADOS_CIVIS, ESCOLARIDADE, UFS } from '@/constants/student'
import { FeedbackDialog, FeedbackType } from '@/components/ui/feedback-dialog'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase' // Mantendo apenas para Auth (login) se necessário, mas idealmente moveria para authService

import { PersonalDataStep } from './matricula/steps/PersonalDataStep'
import { AddressStep } from './matricula/steps/AddressStep'
import { AcademicStep } from './matricula/steps/AcademicStep'
import { EcclesiasticalStep } from './matricula/steps/EcclesiasticalStep'

export default function MatriculaForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [subnucleos, setSubnucleos] = useState<Subnucleo[]>([])
  const [niveis, setNiveis] = useState<Nivel[]>([])

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

  const form = useForm<MatriculaFormData>({
    resolver: zodResolver(matriculaSchema)
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = form

  // Carregar dados iniciais via Service
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subs, nivs] = await Promise.all([
          studentService.getSubnucleos(),
          studentService.getNiveis()
        ])
        setSubnucleos(subs)
        setNiveis(nivs)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        showFeedback('Erro', 'Falha ao carregar dados do sistema', 'error')
      }
    }
    loadData()
  }, [])

  const onSubmit = async (data: MatriculaFormData) => {
    setIsLoading(true)

    try {
      // Validar CPF simples
      const cpf = data.cpf.replace(/\D/g, '')
      if (cpf.length !== 11) {
        showFeedback('Atenção', 'CPF deve ter 11 dígitos', 'warning')
        setIsLoading(false)
        return
      }

      // Executar criação via Service
      const response = await studentService.createStudent(data)

      if (!response.success) {
        if (response.error?.includes('duplicate key') || response.error?.includes('already exists')) {
          if (response.error?.includes('email')) {
            showFeedback('Erro', 'Este email já está cadastrado', 'error')
          } else if (response.error?.includes('cpf')) {
            showFeedback('Erro', 'Este CPF já está cadastrado', 'error')
          } else {
            showFeedback('Erro', 'Dados já cadastrados no sistema', 'error')
          }
        } else {
          showFeedback('Erro', response.error || 'Erro ao processar matrícula', 'error')
        }
        return
      }

      // Enviar magic link por email (Ainda direto no Supabase Auth por enquanto)
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signInError) {
        console.error('Erro ao enviar magic link:', signInError)
        showFeedback('Erro', 'Aluno criado, mas erro ao enviar link de acesso.', 'warning')
        return
      }

      showFeedback('Sucesso', 'Matrícula realizada com sucesso! Enviamos um link de acesso para seu email.', 'success')
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <PersonalDataStep form={form} />
          <AddressStep form={form} />
          <AcademicStep form={form} />
          <EcclesiasticalStep form={form} />

          {/* Dados de Matrícula (Simples o suficiente para ficar aqui ou virar Step separado se crescer) */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Matrícula</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

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
      </div>
    </div>
  )
}
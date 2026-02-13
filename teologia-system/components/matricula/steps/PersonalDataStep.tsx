import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { User, Mail, Phone, CreditCard } from 'lucide-react'
import { MatriculaFormData } from '@/types/student'

interface PersonalDataStepProps {
  form: UseFormReturn<MatriculaFormData>
}

export function PersonalDataStep({ form }: PersonalDataStepProps) {
  const { register, formState: { errors } } = form

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Pessoais</CardTitle>
        <CardDescription>
          Informe seus dados para realizar a matrícula
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
      </CardContent>
    </Card>
  )
}

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MatriculaFormData } from '@/types/student'
import { ESTADOS_CIVIS, ESCOLARIDADE, UFS } from '@/constants/student'

interface AcademicStepProps {
  form: UseFormReturn<MatriculaFormData>
}

export function AcademicStep({ form }: AcademicStepProps) {
  const { register, watch, formState: { errors } } = form

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Complementares e Acadêmicos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados Complementares */}
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

        <hr className="border-gray-200" />

        {/* Questão Teologia */}
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
      </CardContent>
    </Card>
  )
}

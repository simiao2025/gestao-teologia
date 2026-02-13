import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MatriculaFormData } from '@/types/student'

interface EcclesiasticalStepProps {
  form: UseFormReturn<MatriculaFormData>
}

export function EcclesiasticalStep({ form }: EcclesiasticalStepProps) {
  const { register, formState: { errors } } = form

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Eclesiásticos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  )
}

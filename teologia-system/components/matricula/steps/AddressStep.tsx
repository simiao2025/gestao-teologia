import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import { MatriculaFormData } from '@/types/student'
import { UFS } from '@/constants/student'

interface AddressStepProps {
  form: UseFormReturn<MatriculaFormData>
}

export function AddressStep({ form }: AddressStepProps) {
  const { register, formState: { errors } } = form

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Endereço
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="endereco" className="text-sm font-medium text-gray-700">
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
      </CardContent>
    </Card>
  )
}

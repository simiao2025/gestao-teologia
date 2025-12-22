import React from 'react'
import { cn, getStatusColor, getStatusLabel, getNivelColor, getNivelLabel } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'status' | 'nivel' | 'success' | 'warning' | 'error' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    status: '', // Usará getStatusColor dinamicamente
    nivel: '', // Usará getNivelColor dinamicamente
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    outline: 'border border-gray-200 text-gray-800'
  }

  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'

  return (
    <div
      className={cn(
        baseClasses,
        variant === 'status' || variant === 'nivel' ? '' : variants[variant],
        className
      )}
      {...props}
    />
  )
}



// Componente específico para status
interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
  variant?: never
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  const colorClasses = getStatusColor(status)

  return (
    <div
      className={cn(baseClasses, colorClasses, className)}
      {...props}
    >
      {getStatusLabel(status)}
    </div>
  )
}

// Componente específico para nível
interface NivelBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  nivel: 'basico' | 'medio' | 'avancado'
  variant?: never
}

function NivelBadge({ nivel, className, ...props }: NivelBadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  const colorClasses = getNivelColor(nivel)

  return (
    <div
      className={cn(baseClasses, colorClasses, className)}
      {...props}
    >
      {getNivelLabel(nivel)}
    </div>
  )
}

export { Badge, StatusBadge, NivelBadge }
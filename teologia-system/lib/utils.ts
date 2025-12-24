import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Status de pedidos
    'pendente': 'bg-yellow-100 text-yellow-800',
    'pago': 'bg-green-100 text-green-800',
    'enviado': 'bg-blue-100 text-blue-800',
    'entregue': 'bg-purple-100 text-purple-800',
    'cancelado': 'bg-red-100 text-red-800',

    // Status de alunos
    'ativo': 'bg-green-100 text-green-800',
    'trancado': 'bg-red-100 text-red-800',
    'desistente': 'bg-gray-100 text-gray-800',
    'concluído': 'bg-blue-100 text-blue-800',

    // Status acadêmico
    'cursando': 'bg-blue-100 text-blue-800',
    'aprovado': 'bg-green-100 text-green-800',
    'reprovado': 'bg-red-100 text-red-800',

    // Status de pagamento Pix
    'gerado': 'bg-yellow-100 text-yellow-800',
    'expirado': 'bg-red-100 text-red-800'
  }

  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    // Status de pedidos
    'pendente': 'Pendente',
    'pago': 'Pago',
    'enviado': 'Enviado',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado',

    // Status de alunos
    'ativo': 'Ativo',
    'trancado': 'Trancado',
    'desistente': 'Desistente',
    'concluído': 'Concluído',

    // Status acadêmico
    'cursando': 'Cursando',
    'aprovado': 'Aprovado',
    'reprovado': 'Reprovado',

    // Status de pagamento Pix
    'gerado': 'Gerado',
    'expirado': 'Expirado'
  }

  return statusLabels[status] || status
}

export function getNivelColor(nivel: string): string {
  const nivelColors: Record<string, string> = {
    'basico': 'bg-green-100 text-green-800',
    'medio': 'bg-yellow-100 text-yellow-800',
    'avancado': 'bg-red-100 text-red-800'
  }

  return nivelColors[nivel] || 'bg-gray-100 text-gray-800'
}

export function getNivelLabel(nivel: string): string {
  const nivelLabels: Record<string, string> = {
    'basico': 'Básico',
    'medio': 'Médio',
    'avancado': 'Avançado'
  }

  return nivelLabels[nivel] || nivel
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

export function maskCpf(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}
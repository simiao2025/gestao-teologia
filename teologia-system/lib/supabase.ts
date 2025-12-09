import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Tipos TypeScript para as tabelas
export interface Usuario {
  id: string
  nome: string
  email: string
  telefone?: string
  tipo: 'aluno' | 'monitor' | 'diretoria' | 'admin'
  criado_em: string
}

export interface Aluno extends Usuario {
  cpf: string
  data_nascimento: string
  endereco: string
  subnucleo_id?: string
  status: 'ativo' | 'trancado' | 'concluído'
}

export interface Subnucleo {
  id: string
  nome: string
  endereco?: string
  cidade: string
  estado: string
  monitor_id?: string
  criado_em: string
}

export interface Disciplina {
  id: string
  nivel: 'basico' | 'medio' | 'avancado'
  codigo: string
  nome: string
  descricao?: string
  criado_em: string
}

export interface Livro {
  id: string
  disciplina_id: string
  titulo: string
  descricao?: string
  valor: number
  criado_em: string
}

export interface Pedido {
  id: string
  aluno_id: string
  livro_id: string
  valor: number
  status: 'pendente' | 'pago' | 'enviado' | 'entregue'
  txid?: string
  criado_em: string
}

export interface PagamentoPix {
  id: string
  pedido_id: string
  txid: string
  copia_cola: string
  valor: number
  status: 'gerado' | 'pago' | 'expirado'
  data_pagamento?: string
  criado_em: string
}

export interface AlunoDisciplina {
  id: string
  aluno_id: string
  disciplina_id: string
  status: 'cursando' | 'aprovado' | 'reprovado' | 'pendente'
  nota?: number
  data_inicio?: string
  data_conclusao?: string
  criado_em: string
}
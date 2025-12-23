import { z } from 'zod'

// Esquemas de validação para formulários

// Schema para matrícula de aluno
export const matriculaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  data_nascimento: z.string().min(1, 'Data de nascimento obrigatória'),
  endereco: z.string().min(5, 'Endereço inválido'),
  subnucleo_id: z.string().uuid('Subnúcleo inválido'),
  nivel_id: z.string().uuid('Nível inválido'),
  rg: z.string().min(5, 'RG obrigatório'),
  estado_civil: z.string().min(1, 'Estado civil obrigatório'),
  naturalidade: z.string().min(2, 'Cidade de nascimento obrigatória'),
  uf_nascimento: z.string().length(2, 'UF inválida'),
  escolaridade: z.string().min(1, 'Escolaridade obrigatória'),
  profissao: z.string().min(2, 'Profissão obrigatória'),
  cargo_igreja: z.string().min(2, 'Cargo na igreja obrigatório'),
  congregacao: z.string().min(2, 'Congregação obrigatória'),
  ja_estudou_teologia: z.boolean().default(false),
  instituicao_teologia: z.string().optional(),
  cidade: z.string().min(2, 'Cidade obrigatória'),
  uf: z.string().length(2, 'UF inválida'),
  cep: z.string().min(8, 'CEP inválido')
})

export type MatriculaFormData = z.infer<typeof matriculaSchema>

// Schema para edição de dados do aluno
export const alunoEditSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  endereco: z.string().min(5, 'Endereço inválido'),
  status: z.enum(['ativo', 'trancado', 'concluído']),
  subnucleo_id: z.string().uuid('Subnúcleo inválido')
})

export type AlunoEditFormData = z.infer<typeof alunoEditSchema>

// Schema para subnúcleo
export const subnucleoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  endereco: z.string().optional(),
  cidade: z.string().min(2, 'Cidade obrigatória'),
  estado: z.string().min(2, 'Estado obrigatório'),
  monitor_id: z.string().uuid('Monitor inválido')
})

export type SubnucleoFormData = z.infer<typeof subnucleoSchema>

// Schema para disciplina
export const disciplinaSchema = z.object({
  nivel: z.enum(['basico', 'medio', 'avancado']),
  codigo: z.string().min(3, 'Código deve ter pelo menos 3 caracteres'),
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional()
})

export type DisciplinaFormData = z.infer<typeof disciplinaSchema>

// Schema para livro
export const livroSchema = z.object({
  disciplina_id: z.string().uuid('Disciplina inválida'),
  titulo: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  descricao: z.string().optional(),
  valor: z.number().min(0.01, 'Valor deve ser maior que 0')
})

export type LivroFormData = z.infer<typeof livroSchema>

// Schema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
})

export type LoginFormData = z.infer<typeof loginSchema>

// Schema para pedido de livro
export const pedidoSchema = z.object({
  livro_id: z.string().uuid('Livro inválido')
})

export type PedidoFormData = z.infer<typeof pedidoSchema>

// Schema para filtro de busca
export const buscaSchema = z.object({
  busca: z.string().optional(),
  status: z.string().optional(),
  nivel: z.string().optional(),
  disciplina_id: z.string().optional(),
  subnucleo_id: z.string().optional()
})

export type BuscaFormData = z.infer<typeof buscaSchema>

// Schema para progressão acadêmica
export const progressaoSchema = z.object({
  status: z.enum(['cursando', 'aprovado', 'reprovado', 'pendente']),
  nota: z.number().min(0).max(100).optional(),
  data_inicio: z.string().optional(),
  data_conclusao: z.string().optional()
})

export type ProgressaoFormData = z.infer<typeof progressaoSchema>

// Schema para atualização de status do pedido
export const statusPedidoSchema = z.object({
  status: z.enum(['pendente', 'pago', 'enviado', 'entregue'])
})

export type StatusPedidoFormData = z.infer<typeof statusPedidoSchema>

// Validar CPF
export function validateCpf(cpf: string): boolean {
  const cleanedCpf = cpf.replace(/\D/g, '')

  if (cleanedCpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanedCpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanedCpf.charAt(i)) * (10 - i)
  }

  let firstDigit = 11 - (sum % 11)
  if (firstDigit >= 10) firstDigit = 0

  if (parseInt(cleanedCpf.charAt(9)) !== firstDigit) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanedCpf.charAt(i)) * (11 - i)
  }

  let secondDigit = 11 - (sum % 11)
  if (secondDigit >= 10) secondDigit = 0

  return parseInt(cleanedCpf.charAt(10)) === secondDigit
}

// Validar telefone
export function validatePhone(phone: string): boolean {
  const cleanedPhone = phone.replace(/\D/g, '')
  return cleanedPhone.length >= 10 && cleanedPhone.length <= 11
}
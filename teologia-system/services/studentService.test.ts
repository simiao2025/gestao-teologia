import { describe, it, expect, vi, beforeEach } from 'vitest'
import { studentService } from './studentService'
import * as SupabaseLib from '@/lib/supabase'

// Mock do módulo supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn()
    }
  }
})

describe('StudentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSubnucleos', () => {
    it('deve retornar a lista de subnúcleos quando sucesso', async () => {
      // Setup do Mock
      const mockData = [{ id: '1', nome: 'Sub 1' }]
      const selectMock = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: mockData, error: null }) })
      
      // @ts-ignore
      SupabaseLib.supabase.from.mockReturnValue({
        select: selectMock
      })

      const result = await studentService.getSubnucleos()
      
      expect(SupabaseLib.supabase.from).toHaveBeenCalledWith('subnucleos')
      expect(result).toEqual(mockData)
    })

    it('deve lançar erro quando falha', async () => {
       const selectMock = vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Erro' } }) })
       // @ts-ignore
       SupabaseLib.supabase.from.mockReturnValue({ select: selectMock })

       await expect(studentService.getSubnucleos()).rejects.toThrow('Falha ao carregar subnúcleos')
    })
  })

  describe('createStudent', () => {
    it('deve chamar rpc criar_aluno com dados formatados', async () => {
      // Mock da RPC
      // @ts-ignore
      SupabaseLib.supabase.rpc.mockResolvedValue({ data: true, error: null })

      const formData: any = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        telefone: '11999999999',
        cpf: '123.456.789-00', // CPF com formatação
        data_nascimento: '1990-01-01',
        endereco: 'Rua A',
        subnucleo_id: '123',
        nivel_id: '456',
        rg: '123456',
        estado_civil: 'Solteiro',
        naturalidade: 'SP',
        uf_nascimento: 'SP',
        escolaridade: 'Médio',
        profissao: 'Teste',
        cargo_igreja: 'Membro',
        congregacao: 'Sede',
        ja_estudou_teologia: false
      }

      await studentService.createStudent(formData)

      expect(SupabaseLib.supabase.rpc).toHaveBeenCalledWith('criar_aluno', expect.objectContaining({
        p_nome: 'João Silva',
        p_cpf: '12345678900' // Verifica se limpou o CPF
      }))
    })

    it('deve retornar erro se a RPC falhar', async () => {
      // @ts-ignore
      SupabaseLib.supabase.rpc.mockResolvedValue({ data: null, error: { message: 'Erro de banco' } })

      const formData: any = { cpf: '123.456.789-00' } // Mock parcial
      const result = await studentService.createStudent(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Erro de banco')
    })
  })
})

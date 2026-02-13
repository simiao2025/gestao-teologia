import { supabase } from '@/lib/supabase';
import { Subnucleo, Nivel, MatriculaFormData, CreateStudentResponse } from '@/types/student';

export const studentService = {
  /**
   * Busca todos os subnúcleos ativos ordenados por nome
   */
  async getSubnucleos(): Promise<Subnucleo[]> {
    const { data, error } = await supabase
      .from('subnucleos')
      .select('id, nome, cidade, estado, monitor_id, endereco')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar subnúcleos:', error);
      throw new Error('Falha ao carregar subnúcleos');
    }

    return data || [];
  },

  /**
   * Busca todos os níveis de ensino ordenados
   */
  async getNiveis(): Promise<Nivel[]> {
    const { data, error } = await supabase
      .from('niveis')
      .select('id, nome, ordem')
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar níveis:', error);
      throw new Error('Falha ao carregar níveis');
    }

    return data || [];
  },

  /**
   * Cria um novo aluno e seu usuário associado via RPC
   */
  async createStudent(data: MatriculaFormData): Promise<CreateStudentResponse> {
    const cpf = data.cpf.replace(/\D/g, '');

    const { data: result, error } = await supabase.rpc('criar_aluno', {
      p_nome: data.nome,
      p_email: data.email,
      p_telefone: data.telefone,
      p_cpf: cpf,
      p_data_nascimento: data.data_nascimento,
      p_endereco: data.endereco,
      p_subnucleo_id: data.subnucleo_id,
      p_nivel_id: data.nivel_id,
      p_rg: data.rg,
      p_estado_civil: data.estado_civil,
      p_naturalidade: data.naturalidade,
      p_uf_nascimento: data.uf_nascimento,
      p_escolaridade: data.escolaridade,
      p_profissao: data.profissao,
      p_cargo_igreja: data.cargo_igreja,
      p_congregacao: data.congregacao,
      p_ja_estudou_teologia: data.ja_estudou_teologia,
      p_instituicao_teologia: data.ja_estudou_teologia ? data.instituicao_teologia : null
    });

    if (error) {
      console.error('Erro ao criar aluno (Service):', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      message: 'Aluno criado com sucesso'
    };
  }
};

import { z } from 'zod';
import { matriculaSchema, alunoEditSchema } from '@/lib/validations';

// Tipos inferidos do Zod (Single Source of Truth)
export type MatriculaFormData = z.infer<typeof matriculaSchema>;
export type AlunoEditFormData = z.infer<typeof alunoEditSchema>;

// Interfaces de Domínio (Baseadas no Supabase mas enriquecidas)
export interface Subnucleo {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  monitor_id?: string;
  endereco?: string;
}

export interface Nivel {
  id: string;
  nome: string;
  ordem: number;
}

// Interface para resposta de criação (pode incluir dados extras)
export interface CreateStudentResponse {
  success: boolean;
  message?: string;
  studentId?: string;
  error?: string;
}

-- Correção Fase 1: Adicionar suporte a múltiplos lembretes
ALTER TABLE disciplinas 
RENAME COLUMN lembrete_enviado TO lembrete_48h_enviado;

ALTER TABLE disciplinas 
ADD COLUMN IF NOT EXISTS lembrete_24h_enviado boolean DEFAULT false;

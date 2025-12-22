-- Atualiza a restrição de status dos pedidos para incluir 'cancelado'
-- Execute este script no SQL Editor do Supabase Dashboard

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;

ALTER TABLE pedidos 
ADD CONSTRAINT pedidos_status_check 
CHECK (status IN ('pendente', 'pago', 'enviado', 'entregue', 'cancelado'));

COMMENT ON COLUMN pedidos.status IS 'Status do pedido: pendente, pago, enviado, entregue ou cancelado';

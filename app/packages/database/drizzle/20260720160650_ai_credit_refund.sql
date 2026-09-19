-- Novo motivo de lançamento: devolução de uma mensagem cobrada cuja geração
-- falhou. Fica separado de `grant` para o extrato distinguir cortesia de
-- estorno.
ALTER TYPE "public"."ai_credit_reason" ADD VALUE 'refund';

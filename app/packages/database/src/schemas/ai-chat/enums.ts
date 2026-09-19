import { pgEnum } from 'drizzle-orm/pg-core';

/** Papel de uma mensagem de chat com IA. */
export const aiMessageRoleEnum = pgEnum('ai_message_role', [
  'user',
  'assistant',
  'system'
]);

export type AiMessageRole = (typeof aiMessageRoleEnum.enumValues)[number];

/**
 * Motivo de um lançamento no ledger de créditos de IA. `refund` é a devolução
 * de uma mensagem cobrada cuja geração falhou.
 */
export const aiCreditReasonEnum = pgEnum('ai_credit_reason', [
  'use',
  'purchase',
  'grant',
  'refund'
]);

export type AiCreditReason = (typeof aiCreditReasonEnum.enumValues)[number];

export const aiKnowledgeDocumentStatusEnum = pgEnum(
  'ai_knowledge_document_status',
  ['processing', 'ready', 'failed']
);

export type AiKnowledgeDocumentStatus =
  (typeof aiKnowledgeDocumentStatusEnum.enumValues)[number];

/** Situação de uma compra de créditos de IA (checkout AbacatePay). */
export const aiCreditPurchaseStatusEnum = pgEnum('ai_credit_purchase_status', [
  'pending',
  'paid',
  'canceled'
]);

export type AiCreditPurchaseStatus =
  (typeof aiCreditPurchaseStatusEnum.enumValues)[number];

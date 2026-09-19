import { pgEnum } from 'drizzle-orm/pg-core';

/** Constrói pgEnum a partir de objeto const; retorna tipo tupla para Drizzle. */
function enumToPgEnum<T extends Record<string, string>>(
  myEnum: T
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum) as [T[keyof T], ...T[keyof T][]];
}

// ============================================================================
// Autenticação
// ============================================================================

export enum Role {
  MEMBER = 'member',
  ADMIN = 'admin'
}
export const roleEnum = pgEnum('Role', enumToPgEnum(Role));

// ============================================================================
// Organizações
// ============================================================================

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REVOKED = 'revoked'
}

export enum DayOfWeek {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday'
}

export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export enum ActorType {
  SYSTEM = 'system',
  MEMBER = 'member',
  API = 'api'
}
export const invitationStatusEnum = pgEnum('invitationstatus',enumToPgEnum(InvitationStatus));
export const dayOfWeekEnum = pgEnum('day_of_week', enumToPgEnum(DayOfWeek));
export const actionTypeEnum = pgEnum('action_type', enumToPgEnum(ActionType));
export const actorTypeEnum = pgEnum('actor_type', enumToPgEnum(ActorType));

// ============================================================================
// Integrações
// ============================================================================

export const WebhookTrigger = {
  EVENT_REGISTRATION_CREATED: 'eventRegistrationCreated'
} as const;

export type WebhookTrigger =
  (typeof WebhookTrigger)[keyof typeof WebhookTrigger];

export const webhookTriggerEnum = pgEnum(
  'webhook_trigger',
  enumToPgEnum(WebhookTrigger)
);

import { z } from 'zod';

export const organizationNameSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? 'Nome é obrigatório.'
        : 'O nome deve ser texto.'
  })
  .trim()
  .min(1, 'Nome é obrigatório.')
  .max(255, 'Máximo de 255 caracteres.');

export const organizationSlugSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined
        ? 'Slug é obrigatório.'
        : 'O slug deve ser texto.'
  })
  .trim()
  .min(1, 'Slug é obrigatório.')
  .max(255, 'Máximo de 255 caracteres.');

export const organizationAddressSchema = z
  .string({ error: 'O endereço deve ser texto.' })
  .trim()
  .max(255, 'Máximo de 255 caracteres.');

export const organizationPhoneSchema = z
  .string({ error: 'O telefone deve ser texto.' })
  .trim()
  .max(32, 'Máximo de 32 caracteres.');

export const organizationEmailSchema = z
  .string({ error: 'O email deve ser texto.' })
  .trim()
  .min(1, 'Email inválido.')
  .max(255, 'Máximo de 255 caracteres.')
  .email('Email inválido.');

export const organizationWebsiteSchema = z
  .string({ error: 'O site deve ser texto.' })
  .trim()
  .max(2000, 'Máximo de 2000 caracteres.');

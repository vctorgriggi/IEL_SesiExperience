import {
  addDays,
  buildInviteToken,
  CULTURE_CONSENT_VERSION,
  CULTURE_INVITE_DEADLINE_DAYS,
  CULTURE_INVITE_TOKEN_SEED,
  type CultureInviteRole
} from '../analysis/culture-invites';
import type { CultureRespondentInvite } from '../types';

/**
 * Convites da amostra de colaboradores das empresas curadas (M2).
 *
 * São coerentes com as respostas que já existem em `DEMO_CULTURE_ANSWERS`:
 * quem já respondeu tem `answeredAt`, e a soma dos respondidos bate com o
 * `count` agregado das respostas de equipe daquela empresa. O contrário
 * produziria uma tela dizendo "7 de 10 responderam" sobre uma média formada
 * por outro número de pessoas.
 *
 * As três empresas cobrem os três estados que a visão geral precisa mostrar:
 *
 * - **Cerrado Distribuição**: consulta em andamento, prazo vencendo amanhã.
 *   A segunda leva de convites saiu depois da primeira, e é o prazo dela que
 *   a tela mostra.
 * - **Horizonte Alimentos**: consulta completa, gestão, RH e equipe.
 * - **Oficina Pantanal**: prazo vencido com 3 de 8. O perfil não fecha, e a
 *   tela diz isso em vez de tratar duas respostas de equipe como "a equipe".
 */

type InviteSeed = {
  id: string;
  companyId: string;
  name: string;
  corporateEmail: string;
  role: CultureInviteRole;
  area: string;
  sentAt: string;
  answeredAt: string | null;
};

function buildInvite(seed: InviteSeed): CultureRespondentInvite {
  return {
    id: seed.id,
    companyId: seed.companyId,
    name: seed.name,
    corporateEmail: seed.corporateEmail,
    role: seed.role,
    area: seed.area,
    token: buildInviteToken(seed.id, CULTURE_INVITE_TOKEN_SEED),
    sentAt: seed.sentAt,
    expiresAt: addDays(seed.sentAt, CULTURE_INVITE_DEADLINE_DAYS),
    answeredAt: seed.answeredAt,
    consentVersion: seed.answeredAt ? CULTURE_CONSENT_VERSION : null,
    resendCount: 0
  };
}

const PRIMEIRA_LEVA_CERRADO = '2026-09-05';
const SEGUNDA_LEVA_CERRADO = '2026-09-12';
const RESPOSTA_EQUIPE_CERRADO = '2026-09-08';

const INVITE_SEEDS: InviteSeed[] = [
  ...[
    'Tarsila Moreira',
    'Wilson Prates',
    'Yara Bittencourt',
    'Zeca Fontes',
    'Alice Camargo',
    'Bento Siqueira',
    'Clara Menezes'
  ].map((name, index) => ({
    id: `INV-EMP01-${String(index + 1).padStart(2, '0')}`,
    companyId: 'EMP-01',
    name,
    corporateEmail: `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(' ', '.')}@cerrado.example.com`,
    role: 'equipe' as const,
    area: 'Logística',
    sentAt: PRIMEIRA_LEVA_CERRADO,
    answeredAt: RESPOSTA_EQUIPE_CERRADO
  })),
  ...['Davi Rezende', 'Eva Nogueira', 'Firmino Alcântara'].map(
    (name, index) => ({
      id: `INV-EMP01-${String(index + 8).padStart(2, '0')}`,
      companyId: 'EMP-01',
      name,
      corporateEmail: `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(' ', '.')}@cerrado.example.com`,
      role: 'equipe' as const,
      area: 'Expedição',
      sentAt: SEGUNDA_LEVA_CERRADO,
      answeredAt: null
    })
  ),

  {
    id: 'INV-EMP02-01',
    companyId: 'EMP-02',
    name: 'Rafael Nogueira',
    corporateEmail: 'rafael.nogueira@horizonte.example.com',
    role: 'gestao',
    area: 'Estoque',
    sentAt: '2026-09-01',
    answeredAt: '2026-09-02'
  },
  {
    id: 'INV-EMP02-02',
    companyId: 'EMP-02',
    name: 'Simone Vasques',
    corporateEmail: 'simone.vasques@horizonte.example.com',
    role: 'rh',
    area: 'Gente e Gestão',
    sentAt: '2026-09-01',
    answeredAt: '2026-09-02'
  },
  ...['Heitor Salles', 'Ivone Caldas', 'Juliano Peixoto', 'Kátia Beltrão'].map(
    (name, index) => ({
      id: `INV-EMP02-${String(index + 3).padStart(2, '0')}`,
      companyId: 'EMP-02',
      name,
      corporateEmail: `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(' ', '.')}@horizonte.example.com`,
      role: 'equipe' as const,
      area: 'Estoque',
      sentAt: '2026-09-04',
      answeredAt: '2026-09-06'
    })
  ),

  {
    id: 'INV-EMP03-01',
    companyId: 'EMP-03',
    name: 'Sônia Prado',
    corporateEmail: 'sonia.prado@pantanal.example.com',
    role: 'gestao',
    area: 'Administrativo',
    sentAt: '2026-08-28',
    answeredAt: '2026-08-30'
  },
  ...[
    'Lúcio Barreto',
    'Marta Quintela',
    'Norberto Íris',
    'Olívia Tavares',
    'Paulo Serrano',
    'Quitéria Lemos',
    'Raul Espíndola'
  ].map((name, index) => ({
    id: `INV-EMP03-${String(index + 2).padStart(2, '0')}`,
    companyId: 'EMP-03',
    name,
    corporateEmail: `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(' ', '.')}@pantanal.example.com`,
    role: 'equipe' as const,
    area: 'Administrativo',
    sentAt: '2026-08-29',
    answeredAt: index < 2 ? '2026-09-01' : null
  }))
];

export const DEMO_CULTURE_INVITES: CultureRespondentInvite[] =
  INVITE_SEEDS.map(buildInvite);

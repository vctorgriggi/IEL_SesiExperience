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
 * São a fonte de `DEMO_CULTURE_ANSWERS`: cada convite respondido responde o
 * próprio bloco de frases (`blocoDoConvite`), e as respostas são agregadas a
 * partir daí. O contrário produziria uma tela dizendo "7 de 10 responderam"
 * sobre uma média formada por outro número de pessoas.
 *
 * As três empresas cobrem os três estados que a visão geral precisa mostrar:
 *
 * - **Cerrado Distribuição**: consulta em andamento, prazo vencendo amanhã.
 *   A segunda leva de convites saiu depois da primeira, e é o prazo dela que
 *   a tela mostra.
 * - **Horizonte Alimentos**: consulta completa — gestão, RH e 10 pessoas da
 *   equipe, o bastante para toda frase ter ao menos 3 respostas da equipe.
 * - **Oficina Pantanal**: prazo vencido com 3 de 8. O perfil não fecha, e a
 *   tela diz isso em vez de tratar duas respostas de equipe como "a equipe".
 *
 * Não há nome em convite nenhum (PRODUTO.md §5.2): a analista cadastra só
 * e-mail corporativo, área e papel. Os nomes abaixo existem apenas para
 * montar o endereço de e-mail, como a empresa o teria, e não são gravados.
 */

/** "Tarsila Moreira" → "tarsila.moreira@<domínio>". */
function corporateEmail(fullName: string, domain: string): string {
  const local = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(' ', '.');
  return `${local}@${domain}`;
}

type InviteSeed = {
  id: string;
  companyId: string;
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
    corporateEmail: corporateEmail(name, 'cerrado.example.com'),
    role: 'equipe' as const,
    area: 'Logística',
    sentAt: PRIMEIRA_LEVA_CERRADO,
    answeredAt: RESPOSTA_EQUIPE_CERRADO
  })),
  ...['Davi Rezende', 'Eva Nogueira', 'Firmino Alcântara'].map(
    (name, index) => ({
      id: `INV-EMP01-${String(index + 8).padStart(2, '0')}`,
      companyId: 'EMP-01',
      corporateEmail: corporateEmail(name, 'cerrado.example.com'),
      role: 'equipe' as const,
      area: 'Expedição',
      sentAt: SEGUNDA_LEVA_CERRADO,
      answeredAt: null
    })
  ),

  {
    id: 'INV-EMP02-01',
    companyId: 'EMP-02',
    corporateEmail: 'rafael.nogueira@horizonte.example.com',
    role: 'gestao',
    area: 'Estoque',
    sentAt: '2026-09-01',
    answeredAt: '2026-09-02'
  },
  {
    id: 'INV-EMP02-02',
    companyId: 'EMP-02',
    corporateEmail: 'simone.vasques@horizonte.example.com',
    role: 'rh',
    area: 'Gente e Gestão',
    sentAt: '2026-09-01',
    answeredAt: '2026-09-02'
  },
  ...[
    'Heitor Salles',
    'Ivone Caldas',
    'Juliano Peixoto',
    'Kátia Beltrão',
    'Lara Pimentel',
    'Mauro Teixeira',
    'Nádia Coutinho',
    'Orlando Viana',
    'Priscila Moura',
    'Renan Castilho'
  ].map((name, index) => ({
    id: `INV-EMP02-${String(index + 3).padStart(2, '0')}`,
    companyId: 'EMP-02',
    corporateEmail: corporateEmail(name, 'horizonte.example.com'),
    role: 'equipe' as const,
    area: 'Estoque',
    sentAt: '2026-09-04',
    answeredAt: '2026-09-06'
  })),

  {
    id: 'INV-EMP03-01',
    companyId: 'EMP-03',
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
    corporateEmail: corporateEmail(name, 'pantanal.example.com'),
    role: 'equipe' as const,
    area: 'Administrativo',
    sentAt: '2026-08-29',
    answeredAt: index < 2 ? '2026-09-01' : null
  }))
];

export const DEMO_CULTURE_INVITES: CultureRespondentInvite[] =
  INVITE_SEEDS.map(buildInvite);

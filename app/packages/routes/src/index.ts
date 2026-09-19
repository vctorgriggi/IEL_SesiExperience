import { keys } from '../keys';

const routeEnv = keys();

export const baseUrl = {
  dashboard: routeEnv.NEXT_PUBLIC_DASHBOARD_URL,
  marketing:
    routeEnv.NEXT_PUBLIC_MARKETING_URL ?? routeEnv.NEXT_PUBLIC_DASHBOARD_URL,
  /** `undefined` quando o app de chat não faz parte do deploy. */
  aiChat: routeEnv.NEXT_PUBLIC_AI_CHAT_URL
} as const;

function encodeSegment(value: string): string {
  return encodeURIComponent(value);
}

/** Sem base configurada devolve o caminho relativo, que serve no mesmo app. */
function toAbsolute(base: string | undefined, path: string): string {
  return base ? new URL(path, base).toString() : path;
}

type ResolveRoute = (path: string) => string;

function buildDashboardRoutes(resolve: ResolveRoute) {
  return {
    index: resolve('/'),
    auth: {
      error: resolve('/auth/error'),
      /** Ponte pro destino final quando ele está em outro app do produto. */
      continue: resolve('/auth/continue'),
      signIn: resolve('/auth/sign-in'),
      signUp: resolve('/auth/sign-up'),
      magicLink: resolve('/auth/magic-link'),
      oauthCallback: resolve('/auth/oauth-callback'),
      recoveryCode: resolve('/auth/recovery-code'),
      totp: resolve('/auth/totp'),
      forgotPassword: {
        index: resolve('/auth/forgot-password'),
        success: resolve('/auth/forgot-password/success')
      },
      changeEmail: {
        expired: resolve('/auth/change-email/expired'),
        invalid: resolve('/auth/change-email/invalid'),
        requestById: (requestId: string) =>
          resolve(`/auth/change-email/request/${encodeSegment(requestId)}`)
      },
      resetPassword: {
        expired: resolve('/auth/reset-password/expired'),
        success: resolve('/auth/reset-password/success'),
        request: {
          index: resolve('/auth/reset-password/request'),
          byId: (requestId: string) =>
            resolve(`/auth/reset-password/request/${encodeSegment(requestId)}`)
        }
      },
      verifyEmail: {
        index: resolve('/auth/verify-email'),
        expired: resolve('/auth/verify-email/expired'),
        success: resolve('/auth/verify-email/success'),
        request: {
          byToken: (token: string) =>
            resolve(`/auth/verify-email/request/${encodeSegment(token)}`)
        }
      }
    },
    invitations: {
      alreadyAccepted: resolve('/invitations/already-accepted'),
      revoked: resolve('/invitations/revoked'),
      request: (token: string) =>
        resolve(`/invitations/request/${encodeSegment(token)}`)
    },
    invite: {
      index: resolve('/invite')
    },
    onboarding: {
      index: resolve('/onboarding'),
      user: resolve('/onboarding/user'),
      organization: resolve('/onboarding/organization')
    },
    select: (slug: string) => resolve(`/select/${encodeSegment(slug)}`),
    /**
     * Central de Seleção IEL — protótipo de demonstração.
     *
     * Área isolada, com dados fictícios e estado local: não compartilha rotas,
     * sessão ou banco com a área autenticada do produto.
     */
    iel: {
      index: resolve('/iel'),
      jobs: {
        index: resolve('/iel/vagas'),
        byId: (jobId: string) => {
          const encodedJobId = encodeSegment(jobId);
          const jobBase = `/iel/vagas/${encodedJobId}`;
          return {
            index: resolve(jobBase),
            comparison: resolve(`${jobBase}/comparar`),
            referral: resolve(`${jobBase}/encaminhamento`),
            /**
             * Importação da planilha exportada da Empregare (M6).
             *
             * Fica sob a vaga porque a planilha é sempre de uma vaga: é a
             * vaga que decide com o que cada linha é comparada.
             */
            import: resolve(`${jobBase}/importar`)
          };
        }
      },
      talents: {
        index: resolve('/iel/talentos'),
        byId: (talentId: string) => {
          const talentBase = `/iel/talentos/${encodeSegment(talentId)}`;
          return {
            index: resolve(talentBase),
            /** Perfil lido no contexto de uma vaga específica. */
            inJob: (jobId: string) =>
              resolve(`${talentBase}?vaga=${encodeSegment(jobId)}`)
          };
        }
      },
      companies: {
        index: resolve('/iel/empresas'),
        byId: (companyId: string) =>
          resolve(`/iel/empresas/${encodeSegment(companyId)}`)
      },
      /**
       * Superfície do candidato.
       *
       * O questionário de fit abre por candidatura, não por talento: o fit é
       * respondido para aquela vaga daquela empresa, e a mesma pessoa pode
       * responder diferente em dois processos. A rota não carrega vaga nem
       * empresa no caminho — o que o candidato vê da vaga vem de
       * `getCandidateJobView`, sem nome de empresa (R5).
       */
      applications: {
        byId: (applicationId: string) => {
          const applicationBase = `/iel/candidatura/${encodeSegment(applicationId)}`;
          return {
            fit: resolve(`${applicationBase}/fit`)
          };
        }
      },
      /**
       * Link do colaborador que responde a consulta de cultura (M2).
       *
       * A chave do caminho é o token opaco do convite, e não o id da empresa
       * nem o da pessoa: quem intercepta a URL não descobre de quem ela é.
       * PRODUTO.md §5.4 — link sem login é credencial portadora, então o
       * escopo é um convite só e a validade é de três dias.
       */
      cultureInvite: {
        byToken: (token: string) =>
          resolve(`/iel/consulta/${encodeSegment(token)}`)
      },
      /**
       * Relatório que a empresa recebe com os currículos enviados (S3).
       *
       * Mesma natureza do link do colaborador: sem login, com o token opaco
       * no lugar do id da vaga. O que a página abre é o recorte do que já foi
       * enviado àquela empresa — nunca outros candidatos, nunca resposta
       * individual de colaborador (PRODUTO.md §5.1).
       */
      report: {
        byToken: (token: string) =>
          resolve(`/iel/relatorio/${encodeSegment(token)}`)
      },
      clarifications: {
        index: resolve('/iel/pendencias'),
        respond: (clarificationId: string) =>
          resolve(`/iel/pendencias/${encodeSegment(clarificationId)}/responder`)
      },
      referrals: {
        index: resolve('/iel/encaminhamentos'),
        byId: (referralId: string) =>
          resolve(`/iel/encaminhamentos/${encodeSegment(referralId)}`)
      },
      dataSources: resolve('/iel/fontes-de-dados')
    },
    openEvents: {
      bySlug: (slug: string) => {
        const encodedSlug = encodeSegment(slug);
        return {
          index: resolve(`/open-events/${encodedSlug}`),
          confirmation: resolve(`/open-events/${encodedSlug}/confirmation`)
        };
      }
    },
    org: (slug: string) => {
      const encodedSlug = encodeSegment(slug);
      const orgBase = `/${encodedSlug}`;

      return {
        index: resolve(orgBase),
        home: resolve(`${orgBase}/home`),
        choosePlan: resolve(`${orgBase}/choose-plan`),
        billing: {
          index: resolve(`${orgBase}/billing`),
          success: resolve(`${orgBase}/billing/success`)
        },
        calendar: {
          index: resolve(`${orgBase}/calendar`)
        },
        map: {
          index: resolve(`${orgBase}/map`)
        },
        support: {
          index: resolve(`${orgBase}/support`)
        },
        settings: {
          index: resolve(`${orgBase}/settings`),
          profile: resolve(`${orgBase}/settings/profile`),
          general: resolve(`${orgBase}/settings/general`),
          members: resolve(`${orgBase}/settings/members`),
          security: resolve(`${orgBase}/settings/security`),
          billing: resolve(`${orgBase}/settings/billing`)
        },
        checkin: {
          byId: (id: string) => ({
            index: resolve(`${orgBase}/checkin/${encodeSegment(id)}`)
          })
        },
        events: {
          index: resolve(`${orgBase}/events`),
          create: resolve(`${orgBase}/events/create`),
          public: resolve(`${orgBase}/events/public`),
          byId: (id: string) => {
            const encodedId = encodeSegment(id);
            const eventBase = `${orgBase}/events/${encodedId}`;
            return {
              index: resolve(eventBase),
              edit: resolve(`${eventBase}/edit`),
              attendees: resolve(`${eventBase}/attendees`),
              tickets: resolve(`${eventBase}/tickets`)
            };
          }
        }
      };
    }
  };
}

function buildMarketingRoutes(resolve: ResolveRoute) {
  return {
    index: resolve('/'),
    termsOfUse: resolve('/terms'),
    privacyPolicy: resolve('/privacy'),
    contact: resolve('/contact')
  };
}

export const api = {
  aiChat: {
    balance: () => '/api/ai-chat/balance',
    byId: (id: string) => `/api/ai-chat/conversations/${encodeSegment(id)}`,
    conversations: (params?: {
      limit?: number;
      cursor?: string | null;
      q?: string | null;
    }) => {
      const search = new URLSearchParams();
      if (params?.limit) search.set('limit', String(params.limit));
      if (params?.cursor) search.set('cursor', params.cursor);
      if (params?.q) search.set('q', params.q);
      const query = search.toString();
      return `/api/ai-chat/conversations${query ? `?${query}` : ''}`;
    },
    creditsCheckout: () => '/api/ai-chat/credits-checkout',
    creditsHistory: (params?: { limit?: number; cursor?: string | null }) => {
      const search = new URLSearchParams();
      if (params?.limit) search.set('limit', String(params.limit));
      if (params?.cursor) search.set('cursor', params.cursor);
      const query = search.toString();
      return `/api/ai-chat/credits-history${query ? `?${query}` : ''}`;
    },
    messages: (conversationId: string) =>
      `/api/ai-chat/conversations/${encodeSegment(conversationId)}/messages`,
    useMessage: () => '/api/ai-chat/use-message'
  },
  chat: () => '/api/chat',
  knowledge: {
    root: () => '/api/knowledge',
    byId: (id: string) => `/api/knowledge/${encodeSegment(id)}`
  },
  events: {
    registrationsExport: (eventId: string) =>
      `/api/events/${encodeSegment(eventId)}/registrations/export`
  },
  registrations: {
    create: () => '/api/registrations',
    cancel: (id: string) => `/api/registrations/${encodeSegment(id)}/cancel`,
    resendEmail: (id: string) =>
      `/api/registrations/${encodeSegment(id)}/resend-email`,
    checkIn: (id: string) => `/api/registrations/${encodeSegment(id)}/check-in`,
    checkInByCodeValidate: (code: string) =>
      `/api/registrations/code/${encodeSegment(code)}/check-in`,
    checkInByCodeConfirm: (code: string) =>
      `/api/registrations/code/${encodeSegment(code)}/check-in`
  },
  tickets: {
    byId: (id: string) => `/api/tickets/${encodeSegment(id)}`
  },
  participants: {
    list: (queryString?: string) =>
      queryString
        ? `/api/participants${queryString.startsWith('?') ? queryString : `?${queryString}`}`
        : '/api/participants'
  },
  users: {
    myOrganizations: () => '/api/users/me/organizations'
  },
  invitations: {
    validate: (token: string) =>
      `/api/invitations/validate/${encodeSegment(token)}`
  },
  iel: {
    assistant: () => '/api/iel/assistant'
  }
} as const;

function buildAiChatRoutes(resolve: ResolveRoute) {
  return {
    index: resolve('/chat'),
    signIn: resolve('/sign-in'),
    knowledge: resolve('/knowledge'),
    settings: resolve('/settings'),
    signUp: resolve('/sign-up'),
    forgotPassword: {
      index: resolve('/forgot-password'),
      success: resolve('/forgot-password/success')
    },
    resetPassword: {
      expired: resolve('/reset-password/expired'),
      success: resolve('/reset-password/success'),
      request: {
        index: resolve('/reset-password/request'),
        byId: (requestId: string) =>
          resolve(`/reset-password/request/${encodeSegment(requestId)}`)
      }
    },
    verifyEmail: {
      index: resolve('/verify-email'),
      expired: resolve('/verify-email/expired'),
      success: resolve('/verify-email/success'),
      request: {
        byToken: (token: string) =>
          resolve(`/verify-email/request/${encodeSegment(token)}`)
      }
    },
    totp: resolve('/totp'),
    recoveryCode: resolve('/recovery-code'),
    error: resolve('/auth-error')
  };
}

export const routes = {
  dashboard: buildDashboardRoutes((path) => path),
  marketing: buildMarketingRoutes((path) => path),
  aiChat: buildAiChatRoutes((path) => path)
} as const;

export const routeUrls = {
  dashboard: buildDashboardRoutes((path) =>
    toAbsolute(baseUrl.dashboard, path)
  ),
  marketing: buildMarketingRoutes((path) =>
    toAbsolute(baseUrl.marketing, path)
  ),
  aiChat: buildAiChatRoutes((path) => toAbsolute(baseUrl.aiChat, path))
} as const;

export function getOrganizationLogoUrl(
  organizationId: string,
  hash: string
): string {
  return `${routeUrls.dashboard.index}api/organization-logos/${encodeSegment(organizationId)}?v=${encodeSegment(hash)}`;
}

export function getUserImageUrl(userId: string, hash: string): string {
  return `${routeUrls.dashboard.index}api/user-images/${encodeSegment(userId)}?v=${encodeSegment(hash)}`;
}

export function getContactImageUrl(contactId: string, hash: string): string {
  return `${routeUrls.dashboard.index}api/contact-images/${encodeSegment(contactId)}?v=${encodeSegment(hash)}`;
}

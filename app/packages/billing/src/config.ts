import { keys } from './keys';
import {
  createBillingConfig,
  PriceInterval,
  PriceModel,
  PriceType,
  type Plan,
  type Product
} from './schema';

enum Feature {
  OneUser = '1 usuário',
  UpdateEvery12Hours = 'Atualização a cada 12h',
  SentimentAnalysisWithIA = 'Análise de sentimento com IA',
  UnlimitedUsers = 'Usuários ilimitados',
  UpdateEveryHour = 'Atualização a cada hora',
  PrioritySupport = 'Suporte prioritário',
  RealTimeUpdate = 'Atualização em tempo real',
  EventDetectionWithIA = 'Detecção de eventos com IA',
  InsightsWithIA = 'Insights com IA'
}

const currency = 'BRL';

const products = [
  {
    id: 'free',
    name: 'Grátis',
    description: 'Comece grátis.',
    label: 'Comece agora',
    isFree: true,
    display: {
      iconClassName: 'text-primary',
      featured: false,
      priceSuffixMonthly: 'sempre gratuito',
      priceSuffixYearly: 'sempre gratuito'
    },
    cta: { kind: 'start', label: 'Começar grátis' },
    access: {
      features: [],
      maxMembers: 1
    },
    features: [
      Feature.OneUser,
      Feature.UpdateEvery12Hours,
      Feature.SentimentAnalysisWithIA
    ],
    plans: [
      {
        id: 'plan-free-month',
        displayIntervals: [PriceInterval.Month],
        prices: [
          {
            id: 'price-free-month-id',
            type: PriceType.Recurring,
            model: PriceModel.Flat,
            interval: PriceInterval.Month,
            cost: 0,
            currency
          }
        ]
      },
      {
        id: 'plan-free-year',
        displayIntervals: [PriceInterval.Year],
        prices: [
          {
            id: 'price-free-year-id',
            interval: PriceInterval.Year,
            type: PriceType.Recurring,
            model: PriceModel.Flat,
            cost: 0,
            currency
          }
        ]
      }
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para a maioria dos times.',
    label: 'Começar',
    recommended: true,
    display: {
      iconClassName: 'text-info',
      badge: 'Mais popular',
      featured: true,
      priceSuffixMonthly: '/ por mês',
      priceSuffixYearly: '/ por mês (anual)'
    },
    cta: { kind: 'checkout', label: 'Assinar' },
    access: {
      features: ['invite_members', 'multiple_members'],
      maxMembers: 999
    },
    features: [
      Feature.UnlimitedUsers,
      Feature.UpdateEveryHour,
      Feature.PrioritySupport
    ],
    plans: [
      {
        id: 'plan-pro-month',
        displayIntervals: [PriceInterval.Month],
        trialDays: 7,
        prices: [
          {
            id:
              keys().NEXT_PUBLIC_BILLING_PRICE_PRO_MONTH_ID ||
              'price-pro-month-id',
            interval: PriceInterval.Month,
            type: PriceType.Recurring,
            model: PriceModel.Flat,
            cost: 24,
            currency
          }
        ]
      },
      {
        id: 'plan-pro-year',
        displayIntervals: [PriceInterval.Year],
        trialDays: 7,
        prices: [
          {
            id:
              keys().NEXT_PUBLIC_BILLING_PRICE_PRO_YEAR_ID || 'price-pro-year-id',
            interval: PriceInterval.Year,
            type: PriceType.Recurring,
            model: PriceModel.Flat,
            cost: 199,
            currency
          }
        ]
      }
    ]
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    description: 'Pague uma vez. Use sempre.',
    label: 'Começar',
    display: {
      iconClassName: 'text-primary',
      badge: 'Avançado',
      featured: false,
      priceSuffixMonthly: 'pagamento único',
      priceSuffixYearly: 'pagamento único'
    },
    cta: { kind: 'checkout', label: 'Comprar' },
    access: {
      features: ['invite_members', 'multiple_members'],
      maxMembers: 999
    },
    features: [
      Feature.RealTimeUpdate,
      Feature.EventDetectionWithIA,
      Feature.InsightsWithIA
    ],
    plans: [
      {
        id: 'plan-lifetime',
        displayIntervals: [PriceInterval.Month, PriceInterval.Year],
        prices: [
          {
            id:
              keys().NEXT_PUBLIC_BILLING_PRICE_LIFETIME_ID ||
              'price-lifetime-id',
            type: PriceType.OneTime,
            model: PriceModel.Flat,
            cost: 699,
            currency
          }
        ]
      }
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para necessidades sob medida.',
    label: 'Fale conosco',
    isEnterprise: true,
    display: {
      iconClassName: 'text-primary',
      badge: 'Sob consulta',
      featured: false,
      priceSuffixMonthly: 'sob consulta',
      priceSuffixYearly: 'sob consulta'
    },
    cta: { kind: 'link', label: 'Fale conosco' },
    access: {
      features: ['invite_members', 'multiple_members'],
      maxMembers: 999
    },
    features: [
      Feature.RealTimeUpdate,
      Feature.EventDetectionWithIA,
      Feature.InsightsWithIA
    ],
    plans: [
      {
        id: 'plan-enterprise-month',
        displayIntervals: [PriceInterval.Month],
        prices: [
          {
            id:
              keys().NEXT_PUBLIC_BILLING_PRICE_ENTERPRISE_MONTH_ID ||
              'price-enterprise-month-id',
            interval: PriceInterval.Month,
            type: PriceType.Recurring,
            model: PriceModel.Flat,
            cost: 0,
            currency
          }
        ]
      },
      {
        id: 'plan-enterprise-year',
        displayIntervals: [PriceInterval.Year],
        prices: [
          {
            id:
              keys().NEXT_PUBLIC_BILLING_PRICE_ENTERPRISE_YEAR_ID ||
              'price-enterprise-year-id',
            interval: PriceInterval.Year,
            type: PriceType.Recurring,
            model: PriceModel.Flat,
            cost: 0,
            currency
          }
        ]
      }
    ]
  }
] as const;

export type PlanId = (typeof products)[number]['id'];

export const PLAN_IDS = products.map((p) => p.id) as PlanId[];

export function isPlanId(value: string): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}

export const billingConfig = createBillingConfig({
  products: products as unknown as Product[]
});

export const billingConfigDisplayIntervals: PriceInterval[] = Array.from(
  new Set(
    billingConfig.products
      .filter((product: Product) => !product.hidden)
      .flatMap((product: Product) =>
        product.plans.flatMap((plan: Plan) => plan.displayIntervals)
      )
      .filter(Boolean)
  )
) as PriceInterval[];

import { z } from 'zod';

export enum PriceInterval {
  Month = 'month',
  Year = 'year'
}

export enum PriceType {
  Recurring = 'recurring',
  OneTime = 'one-time'
}

export enum PriceModel {
  Flat = 'flat',
  PerSeat = 'per_seat',
  Metered = 'metered'
}

const priceSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(PriceType),
    model: z.enum(PriceModel),
    interval: z.enum(PriceInterval).optional(),
    currency: z.string().min(1),
    cost: z.number().min(0)
  })
  .refine(
    (data) => data.type !== PriceType.OneTime || data.interval === undefined,
    { message: 'One-time prices must not have an interval', path: ['interval'] }
  )
  .refine(
    (data) => data.type !== PriceType.Recurring || data.interval !== undefined,
    { message: 'Recurring prices must have an interval', path: ['interval'] }
  )
  .refine(
    (data) => data.type !== PriceType.OneTime || data.model === PriceModel.Flat,
    { message: 'One-time prices must have a flat model', path: ['model'] }
  );

const planSchema = z.object({
  id: z.string().min(1),
  displayIntervals: z.array(z.enum(PriceInterval)),
  trialDays: z.number().positive().optional(),
  prices: z.array(priceSchema).min(1)
});

const productDisplaySchema = z.object({
  iconClassName: z.string().min(1),
  badge: z.string().min(1).optional(),
  featured: z.boolean().optional(),
  priceSuffixMonthly: z.string().min(1),
  priceSuffixYearly: z.string().min(1).optional()
});

const productCtaSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('checkout'),
    label: z.string().min(1)
  }),
  z.object({
    kind: z.literal('start'),
    label: z.string().min(1)
  }),
  z.object({
    kind: z.literal('link'),
    label: z.string().min(1),
    href: z.string().min(1).optional()
  })
]);

const productAccessSchema = z.object({
  features: z.array(z.string()),
  maxMembers: z.number().int().positive()
});

const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  label: z.string().min(1),
  recommended: z.boolean().optional(),
  hidden: z.boolean().optional(),
  isFree: z.boolean().optional(),
  isEnterprise: z.boolean().optional(),
  display: productDisplaySchema,
  cta: productCtaSchema,
  access: productAccessSchema,
  features: z.array(z.string()),
  plans: z.array(planSchema).min(1)
});

const billingConfigSchema = z.object({
  products: z.array(productSchema).min(1)
});

export type BillingConfig = z.infer<typeof billingConfigSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductDisplay = z.infer<typeof productDisplaySchema>;
export type ProductCta = z.infer<typeof productCtaSchema>;
export type ProductAccess = z.infer<typeof productAccessSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Price = z.infer<typeof priceSchema>;

export function createBillingConfig(config: BillingConfig): BillingConfig {
  return billingConfigSchema.parse(config) as BillingConfig;
}

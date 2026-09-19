export type StructuredDataParams = {
  baseUrl: string;
  name: string;
  description: string;
};

export type FaqEntry = { q: string; a: string };

export function organizationSchema({
  baseUrl,
  name,
  description
}: StructuredDataParams) {
  const logoUrl = `${baseUrl}/og.png`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name,
    url: baseUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl
    },
    description
  };
}

export function websiteSchema({
  baseUrl,
  name,
  description
}: StructuredDataParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    url: baseUrl,
    name,
    description,
    publisher: { '@id': `${baseUrl}/#organization` },
    inLanguage: 'pt-BR'
  };
}

export function softwareApplicationSchema({
  baseUrl,
  name,
  description
}: StructuredDataParams) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${baseUrl}/#software`,
    name: `${name} SaaS Template`,
    description,
    url: baseUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: 'pt-BR',
    provider: { '@id': `${baseUrl}/#organization` },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
      url: `${baseUrl}/`
    }
  };
}

export function faqPageSchema(faqs: readonly FaqEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: a
      }
    }))
  };
}

export function buildStructuredDataScript(
  params: StructuredDataParams,
  faqs?: readonly FaqEntry[]
) {
  const organization = organizationSchema(params);
  const website = websiteSchema(params);
  const software = softwareApplicationSchema(params);

  const items: object[] = [organization, website, software];
  if (faqs?.length) {
    items.push(faqPageSchema(faqs));
  }

  return JSON.stringify(items);
}

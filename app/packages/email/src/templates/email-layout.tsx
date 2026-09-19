import React, { type ReactNode } from 'react';
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

export const EMAIL_APP_PRIMARY = '#e85d04';
export const EMAIL_APP_PRIMARY_FOREGROUND = '#ffffff';

const THEME = {
  background: '#f4f4f5',
  cardBg: '#ffffff',
  cardBorder: '#e4e4e7',
  text: '#18181b',
  textMuted: '#71717a',
  link: '#2563eb',
  radius: '12px'
} as const;

export const EMAIL_BODY_FONT_SIZE = '15px';
export const EMAIL_BODY_LINE_HEIGHT = 1.72;

export type EmailLayoutProps = {
  appName: string;
  preview: string;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  headerBackgroundColor?: string;
  headerTextColor?: string;
};

export function EmailLayout({
  preview,
  title,
  children,
  footer
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body
          className="m-auto font-sans"
          style={{
            backgroundColor: THEME.background,
            padding: '24px 16px'
          }}
        >
          <Container
            className="mx-auto max-w-[520px]"
            style={{
              borderRadius: THEME.radius,
              overflow: 'hidden',
              boxShadow:
                '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)'
            }}
          >
            <Section
              style={{
                backgroundColor: THEME.cardBg,
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: THEME.cardBorder,
                borderTop: 'none',
                padding: '32px 28px 28px',
                borderRadius: `0 0 ${THEME.radius} ${THEME.radius}`
              }}
            >
              {title !== undefined && title !== '' ? (
                <Heading
                  style={{
                    margin: '0 0 24px',
                    fontSize: '22px',
                    fontWeight: 600,
                    color: THEME.text,
                    textAlign: 'center' as const,
                    lineHeight: 1.3
                  }}
                >
                  {title}
                </Heading>
              ) : null}
              {children}
              {footer ? (
                <>
                  <Hr
                    style={{
                      margin: '28px 0 20px',
                      borderColor: THEME.cardBorder
                    }}
                  />
                  <Text
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: 1.5,
                      color: THEME.textMuted
                    }}
                  >
                    {footer}
                  </Text>
                </>
              ) : null}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export function EmailParagraph({
  children,
  style = {}
}: {
  children: ReactNode;
  style?: Record<string, string | number>;
}) {
  return (
    <Text
      style={{
        margin: '0 0 16px',
        fontSize: EMAIL_BODY_FONT_SIZE,
        lineHeight: EMAIL_BODY_LINE_HEIGHT,
        color: THEME.text,
        ...style
      }}
    >
      {children}
    </Text>
  );
}

/** Border radius do botão, alinhado ao radius da brand (card usa 12px; botão um pouco menor). */
const BUTTON_RADIUS = '10px';

export function EmailButtonStyle() {
  return {
    display: 'inline-block' as const,
    padding: '18px 36px',
    backgroundColor: EMAIL_APP_PRIMARY,
    color: EMAIL_APP_PRIMARY_FOREGROUND,
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: BUTTON_RADIUS,
    textAlign: 'center' as const
  };
}

export function EmailLinkStyle() {
  return {
    color: THEME.link,
    textDecoration: 'none'
  };
}

const FALLBACK_BOX_STYLE = {
  backgroundColor: '#f4f4f5',
  border: `1px solid ${THEME.cardBorder}`,
  borderRadius: '8px',
  padding: '14px 16px',
  margin: 0
} as const;

/** Link alternativo: caixa cinza clara com label + link dentro (texto menor). Use após o CTA. */
export function EmailFallbackLink({
  href,
  label = 'Ou copie e cole esta URL no navegador:'
}: {
  href: string;
  /** Texto dentro da caixa, acima do link. Default: "Ou copie e cole esta URL no navegador:" */
  label?: string;
}) {
  return (
    <Section style={{ margin: '16px 0 0' }}>
      <Row>
        <Column style={FALLBACK_BOX_STYLE}>
          <Text
            style={{
              margin: '0 0 8px',
              fontSize: '13px',
              lineHeight: 1.5,
              color: THEME.textMuted
            }}
          >
            {label}
          </Text>
          <Link
            href={href}
            style={{
              margin: 0,
              fontSize: '13px',
              lineHeight: 1.5,
              color: THEME.link,
              wordBreak: 'break-all' as const,
              textDecoration: 'none',
              display: 'block'
            }}
          >
            {href}
          </Link>
        </Column>
      </Row>
    </Section>
  );
}

/** Hero: bloco com cor primária, logo (appName) + headline. Use quando não passar title no layout. */
export function EmailHero({
  appName,
  headline,
  backgroundColor = EMAIL_APP_PRIMARY,
  textColor = EMAIL_APP_PRIMARY_FOREGROUND
}: {
  appName: string;
  headline: string;
  /** Cor de fundo do hero (hex). Default: cor primária do app. */
  backgroundColor?: string;
  /** Cor do texto (hex). Default: branco. */
  textColor?: string;
}) {
  return (
    <Section
      style={{
        backgroundColor,
        padding: '20px 15px',
        borderRadius: THEME.radius,
        textAlign: 'center' as const,
        margin: '0 0 24px'
      }}
    >
      <Text
        style={{
          margin: '0 0 6px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: textColor,
          opacity: 0.95
        }}
      >
        {appName}
      </Text>
      <Heading
        style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: 700,
          color: textColor,
          lineHeight: 1.25,
          letterSpacing: '-0.01em'
        }}
      >
        {headline}
      </Heading>
    </Section>
  );
}

export function EmailGreeting({ name }: { name: string }) {
  return (
    <Text
      style={{
        margin: '0 0 16px',
        fontSize: '19px',
        fontWeight: 600,
        lineHeight: 1.4,
        color: THEME.text
      }}
    >
      Olá {name},
    </Text>
  );
}

export function EmailCtaSection({
  href,
  children,
  style = {},
  buttonStyle
}: {
  href: string;
  children: ReactNode;
  style?: Record<string, string | number>;
  buttonStyle?: Record<string, string | number>;
}) {
  return (
    <Section
      style={{
        textAlign: 'center' as const,
        margin: '28px 0 32px',
        ...style
      }}
    >
      <Button
        href={href}
        style={buttonStyle ?? EmailButtonStyle()}
      >
        {children}
      </Button>
    </Section>
  );
}

export function EmailStepItem({
  icon,
  children,
  isLast = false
}: {
  icon: string;
  children: ReactNode;
  isLast?: boolean;
}) {
  return (
    <Text
      style={{
        margin: isLast ? '0 0 24px 4px' : '0 0 12px 4px',
        fontSize: EMAIL_BODY_FONT_SIZE,
        lineHeight: 1.5,
        color: THEME.text
      }}
    >
      {icon} {children}
    </Text>
  );
}

export function EmailDivider() {
  return (
    <Hr
      style={{
        margin: '8px 0 24px',
        borderColor: THEME.cardBorder
      }}
    />
  );
}

/** Card com linhas label + conteúdo (ex.: "Quem convidou" / "Organização"). */
export function EmailInfoCard({
  rows,
  style = {}
}: {
  rows: Array<{ label: string; content: ReactNode }>;
  style?: Record<string, string | number>;
}) {
  return (
    <Section
      style={{
        backgroundColor: '#fafafa',
        border: `1px solid ${THEME.cardBorder}`,
        borderRadius: '10px',
        padding: '20px 24px',
        margin: '20px 0 24px',
        ...style
      }}
    >
      {rows.map(({ label, content }, i) => (
        <React.Fragment key={label}>
          <Text
            style={{
              margin: i === 0 ? '0 0 4px' : '16px 0 4px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              textTransform: 'uppercase' as const,
              color: THEME.textMuted,
              lineHeight: 1.5
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              margin: 0,
              fontSize: '15px',
              lineHeight: 1.5,
              color: THEME.text
            }}
          >
            {content}
          </Text>
        </React.Fragment>
      ))}
    </Section>
  );
}

/** Estilo do botão CTA com cores customizadas (ex.: convite com tema da org). */
export function getThemedButtonStyle(
  backgroundColor = EMAIL_APP_PRIMARY,
  color = EMAIL_APP_PRIMARY_FOREGROUND
) {
  return {
    display: 'inline-block' as const,
    padding: '18px 36px',
    backgroundColor,
    color,
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    borderRadius: '10px',
    textAlign: 'center' as const
  };
}

export function EmailSignature({ name, role }: { name: string; role: string }) {
  return (
    <Text
      style={{
        margin: 0,
        fontSize: '14px',
        lineHeight: 1.5,
        color: THEME.textMuted,
        fontStyle: 'italic'
      }}
    >
      — {name}
      <br />
      {role}
    </Text>
  );
}

export { THEME as EMAIL_THEME };

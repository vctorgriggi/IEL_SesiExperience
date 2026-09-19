import {
  EmailCtaSection,
  EmailDivider,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph,
  EmailSignature,
  EmailStepItem
} from '../templates/email-layout';

export type WelcomeEmailProps = {
  appName: string;
  name: string;
  getStartedLink: string;
};

export function WelcomeEmail({
  appName,
  name,
  getStartedLink
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview={`Bem-vindo ao ${appName}`}
      footer={`Você recebeu este email porque se cadastrou no ${appName}.`}
    >
      <EmailHero
        appName={appName}
        headline={`Bem-vindo ao ${appName}`}
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Sua conta já está pronta e você pode começar em menos de 2 minutos.
      </EmailParagraph>
      <EmailParagraph>Aqui está o primeiro passo:</EmailParagraph>

      <EmailCtaSection href={getStartedLink}>
        Acessar minha conta
      </EmailCtaSection>

      <EmailParagraph>Depois de entrar, recomendamos:</EmailParagraph>
      <EmailStepItem icon="🎯">Criar seu primeiro projeto</EmailStepItem>
      <EmailStepItem icon="👥">Convidar seu time (opcional)</EmailStepItem>
      <EmailStepItem
        icon="✨"
        isLast
      >
        Testar o recurso principal do produto
      </EmailStepItem>

      <EmailDivider />

      <EmailParagraph>
        Se precisar de ajuda, basta responder este e-mail. Nós lemos todas as
        mensagens.
      </EmailParagraph>

      <EmailSignature
        name="Lincoli"
        role={`Founder, ${appName}`}
      />
    </EmailLayout>
  );
}

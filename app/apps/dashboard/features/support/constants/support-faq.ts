export type SupportFaqItem = {
  question: string;
  answer: string;
};

export const supportFaqItems: SupportFaqItem[] = [
  {
    question: 'Como altero os dados da minha organização?',
    answer:
      'Acesse Configurações > Organização > Geral. Lá você pode editar nome, slug e outras informações da organização.'
  },
  {
    question: 'Como convido novos membros para a organização?',
    answer:
      'Em Configurações > Organização > Membros, use o botão "Convidar membro" e informe o e-mail. O convidado receberá um link para aceitar o convite.'
  },
  {
    question: 'Como gerencio meus eventos?',
    answer:
      'Na área de Eventos você pode criar, editar e publicar eventos. Use a lista para ver todos os eventos da organização e acessar detalhes, inscrições e edição.'
  },
  {
    question: 'Onde vejo as inscrições dos participantes?',
    answer:
      'Em Participantes você encontra todas as inscrições nos eventos da organização, com filtros por evento e status. Em cada evento também é possível ver as inscrições na aba correspondente.'
  },
  {
    question: 'Como entro em contato com o suporte?',
    answer:
      'Use o formulário de contato nesta página. Envie sua dúvida ou problema e nossa equipe responderá pelo e-mail da sua conta.'
  }
];

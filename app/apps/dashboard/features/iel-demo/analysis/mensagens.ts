/**
 * A mensagem de WhatsApp que a analista manda ao candidato, em cada etapa.
 *
 * Os jurados pediram foco na comunicação com o candidato e na usabilidade
 * para cargos operacionais (00:08:01: "operacional eles são analfabetos
 * digitais"). Hoje o que chega à pessoa é um link seco. Aqui vira uma
 * mensagem de gente: quem fala, o que a pessoa precisa fazer ou saber, o
 * link, o prazo quando há, e um fecho humano.
 *
 * Esta é a **regra fixa**: custa zero, existe sempre, e é o que a tela
 * mostra na hora. O Mind (`ai/mensagens.ts`) só reescreve por cima quando
 * há chave — e a analista aprova com um toque antes de qualquer envio. Nada
 * sai daqui sozinho.
 *
 * Três limites que nenhuma etapa quebra:
 *
 * - **R5**: o nome da empresa não aparece antes da entrevista (00:22:21,
 *   00:38:43). A vaga é dita por atividade, localidade e turno; na etapa
 *   "a empresa quer conversar", quem revela é a ligação da analista.
 * - **Sem promessa nem culpa**: nem "você vai ser contratado", nem
 *   "reprovado". "Não foi desta vez" diz que a empresa seguiu com outras
 *   pessoas, que o currículo continua no banco e que o IEL segue junto.
 * - **Palavra comum**: sem "prezado", "candidato(a)", "processo seletivo".
 *   Uma frase por ideia, do tamanho de um WhatsApp.
 */

export type EtapaDaMensagem =
  /** Link para responder as 10 frases (prazo de 2 dias, R7). */
  | 'convite-questionario'
  /** Ainda não respondeu; a analista cobra com jeito. */
  | 'lembrete-questionario'
  /** Entrou nos até 5 currículos enviados à empresa (R6). */
  | 'curriculo-enviado'
  /** A empresa pediu entrevista; o IEL liga, a mensagem prepara. */
  | 'empresa-quer-conversar'
  /** A empresa seguiu com outras pessoas. */
  | 'nao-foi-desta-vez'
  /** Check-in de quem foi contratado, aos 30, 60 e 90 dias. */
  | 'como-esta-sendo';

export const ETAPAS_DA_MENSAGEM: EtapaDaMensagem[] = [
  'convite-questionario',
  'lembrete-questionario',
  'curriculo-enviado',
  'empresa-quer-conversar',
  'nao-foi-desta-vez',
  'como-esta-sendo'
];

/** Como cada etapa aparece no seletor da analista. */
export const ETAPA_LABEL: Record<EtapaDaMensagem, string> = {
  'convite-questionario': 'Convite para responder',
  'lembrete-questionario': 'Lembrete: ainda não respondeu',
  'curriculo-enviado': 'Currículo enviado à empresa',
  'empresa-quer-conversar': 'A empresa quer conversar',
  'nao-foi-desta-vez': 'Não foi desta vez',
  'como-esta-sendo': 'Como está sendo? (30/60/90)'
};

export type MarcoDaMensagem = 30 | 60 | 90;

export type EntradaDaMensagem = {
  etapa: EtapaDaMensagem;
  /** Só o primeiro nome: é assim que se fala no WhatsApp. */
  primeiroNome: string;
  /** A atividade da vaga, como em `getCandidateJobView` — nunca a empresa. */
  atividade: string;
  localidade?: string;
  turno?: string;
  /** Último dia para responder, "dd/mm". */
  prazo?: string;
  /** Qual check-in, quando a etapa é "como está sendo". */
  marco?: MarcoDaMensagem;
  /** Link absoluto (candidatura, questionário, check-in). */
  link?: string;
  /** Primeiro nome de quem assina. Sem ele, assina o IEL. */
  analista?: string;
};

export type MensagemAoCandidato = {
  etapa: EtapaDaMensagem;
  canal: 'whatsapp';
  /** A mensagem inteira, pronta para colar. */
  texto: string;
  /** O link que vai junto, absoluto, quando há. */
  link?: string;
  origem: 'regra' | 'mind';
};

/** Quem manda, sempre por extenso: a pessoa pode nunca ter ouvido "IEL". */
export const REMETENTE_DA_MENSAGEM = 'o IEL, o Centro de Empregos da Indústria';

/** "Jonas Curvo Dorileo" → "Jonas". */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

/**
 * "Oi, Jonas! Aqui é Ana, do IEL, o Centro de Empregos da Indústria."
 *
 * A primeira frase diz quem é, porque a pessoa recebe a mensagem de um
 * número que não conhece — e porque o IEL fala em nome próprio, não da
 * empresa (R5).
 */
function abertura(entrada: EntradaDaMensagem): string {
  const nome = entrada.primeiroNome.trim() || 'tudo bem';
  const quem = entrada.analista?.trim()
    ? `${entrada.analista.trim()}, do IEL, o Centro de Empregos da Indústria`
    : REMETENTE_DA_MENSAGEM;
  return `Oi, ${nome}! Aqui é ${quem}.`;
}

/** "Horário comercial (9h às 18h)" → "horário comercial (9h às 18h)". */
function minuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

/**
 * A vaga como o candidato a conhece: atividade, localidade e turno. Sem
 * nome de empresa, e o tipo de entrada nem tem campo para isso. Vem sem
 * artigo ("vaga de …") para caber em "a vaga", "da vaga" e "na vaga".
 */
function vaga(entrada: EntradaDaMensagem, comTurno = false): string {
  const partes = [`vaga de ${entrada.atividade.trim()}`];
  if (entrada.localidade?.trim())
    partes.push(`em ${entrada.localidade.trim()}`);
  if (comTurno && entrada.turno?.trim()) {
    partes.push(minuscula(entrada.turno.trim()));
  }
  return partes.join(', ');
}

/** "Dá para responder até 15/09." ou, sem data, o prazo da regra (R7). */
function prazoDoQuestionario(entrada: EntradaDaMensagem): string {
  return entrada.prazo?.trim()
    ? `Dá para responder até ${entrada.prazo.trim()}.`
    : 'O link vale por 2 dias.';
}

/** A frase que apresenta o link; sem link, a frase termina em ponto. */
function comLink(frase: string, link: string | undefined): string {
  return link ? `${frase}\n${link}` : frase.replace(/:$/, '.');
}

/** A frase que só existe por causa do link ("Você acompanha por aqui:"). */
function soComLink(frase: string, link: string | undefined): string | null {
  return link ? `${frase}\n${link}` : null;
}

/** As linhas de cada etapa. Uma mensagem por etapa, sem variação de sorte. */
function linhas(entrada: EntradaDaMensagem): Array<string | null> {
  const { link } = entrada;

  switch (entrada.etapa) {
    case 'convite-questionario':
      return [
        abertura(entrada),
        `Recebemos sua candidatura para a ${vaga(entrada, true)}.`,
        comLink(
          'O próximo passo é responder 10 frases sobre o seu jeito de trabalhar. Leva uns 5 minutos, é pelo celular e não precisa de senha:',
          link
        ),
        `${prazoDoQuestionario(entrada)} Qualquer dúvida, é só responder aqui.`
      ];

    case 'lembrete-questionario':
      return [
        abertura(entrada),
        `Vi que as 10 frases da sua candidatura para a ${vaga(entrada)} ainda estão sem resposta. Sem elas, a gente não consegue seguir com você nesta vaga.`,
        comLink('São uns 5 minutos, pelo celular:', link),
        `${prazoDoQuestionario(entrada)} Se precisar de ajuda para responder, me chama aqui que a gente faz junto.`
      ];

    case 'curriculo-enviado':
      return [
        abertura(entrada),
        `Boa notícia: seu currículo foi enviado para a empresa da ${vaga(entrada)}. Agora é ela que olha e decide quem chama para conversar.`,
        soComLink('Você acompanha por aqui:', link),
        'Assim que tiver retorno, eu te aviso. Enquanto isso, seu currículo continua no nosso banco para outras vagas.'
      ];

    case 'empresa-quer-conversar':
      return [
        abertura(entrada),
        `A empresa da ${vaga(entrada)} quer conversar com você!`,
        'Vou te ligar ainda hoje para contar qual é a empresa, combinar dia e horário e explicar como chegar. Se puder, deixa o telefone por perto.',
        soComLink('Em que pé está, por aqui:', link),
        'Até já!'
      ];

    case 'nao-foi-desta-vez':
      return [
        abertura(entrada),
        `Tenho um retorno sobre a ${vaga(entrada)}: desta vez, a empresa seguiu com outras pessoas.`,
        'Isso não é sobre você. Seu currículo continua no nosso banco, e as suas respostas valem por 12 meses: quando aparecer outra vaga com a sua cara, eu te chamo.',
        soComLink('O registro fica aqui, se quiser ver:', link),
        'Se quiser conversar sobre os próximos passos, é só responder aqui.'
      ];

    case 'como-esta-sendo': {
      const marco = entrada.marco ?? 30;
      const tempo =
        marco === 90
          ? `Você fechou 90 dias na ${vaga(entrada)}.`
          : `Já faz ${marco} dias que você começou na ${vaga(entrada)}.`;
      return [
        abertura(entrada),
        `${tempo} Como está sendo?`,
        comLink(
          'São 3 perguntas rápidas, pelo celular. A empresa não vê o que você responde; é só para o IEL saber se está tudo bem:',
          link
        ),
        'Se algo não estiver bom, me conta por aqui que eu te ligo.'
      ];
    }
  }
}

/**
 * A mensagem da regra fixa para esta pessoa, nesta etapa.
 *
 * Nunca lança e nunca depende de rede: é o que a analista vê no instante
 * em que abre "Mensagem do Mind". O polimento do modelo, se vier, troca só
 * o texto — a etapa e o link são os daqui.
 */
export function gerarMensagem(entrada: EntradaDaMensagem): MensagemAoCandidato {
  const link = entrada.link?.trim() || undefined;
  return {
    etapa: entrada.etapa,
    canal: 'whatsapp',
    texto: linhas({ ...entrada, link })
      .filter((linha): linha is string => linha !== null)
      .join('\n\n'),
    ...(link ? { link } : {}),
    origem: 'regra'
  };
}

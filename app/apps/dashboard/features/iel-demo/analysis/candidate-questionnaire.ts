/**
 * Questionário de fit do candidato (M3, R4).
 *
 * É o lado que faltava. O traçado da empresa já existia em
 * `analysis/culture.ts`; sem o mesmo traçado do lado da pessoa não há
 * distância a medir, e o percentual de aderência que o cliente pediu (R3,
 * 00:20:19) não teria de onde sair.
 *
 * Três decisões moldam o que está aqui, e nenhuma é estética.
 *
 * **O instrumento é o do cliente.** São as frases de
 * `docs/cliente/04-perguntas-empresa.xlsx` (`analysis/instrumento.ts`),
 * respondidas numa escala de concordância de 5 pontos. O candidato responde
 * 10 delas, uma por tema, escolhidas pela empresa da vaga — as frases em que
 * a equipe dela é mais marcante (`escolherPerguntasDoCandidato`). O público é
 * operacional, com baixo letramento digital (00:08:01): ele lê o `texto`
 * de cada frase — o da planilha, sem edição, a pedido do dono do produto
 * (20/09/2026) —, e a escala aparece em 5 botões com o rótulo escrito.
 *
 * **As mesmas frases da empresa, na voz da pessoa.** O candidato responde a
 * mesma frase que a equipe respondeu. É o que torna a comparação legítima: a
 * aderência é a distância entre duas respostas à mesma frase — não a
 * correlação entre dois instrumentos diferentes.
 *
 * **Não é teste de personalidade.** O briefing veda instrumento psicométrico
 * e o MoSCoW põe "perfil comportamental completo" nos Won't. O que se
 * pergunta aqui é preferência de condição de trabalho: apoio, autonomia,
 * comunicação, horário e aprendizado. Nenhuma pergunta sobre personalidade,
 * saúde (inclusive saúde mental), família, religião, opinião política,
 * filiação sindical ou qualquer outra categoria do art. 5º, II, da LGPD.
 *
 * ## Base legal e minimização
 *
 * A base legal do tratamento é o **consentimento do titular** — LGPD, art.
 * 7º: "O tratamento de dados pessoais somente poderá ser realizado nas
 * seguintes hipóteses: I - mediante o fornecimento de consentimento pelo
 * titular". O aceite é registrado junto da resposta (ver
 * `CandidateFitResponse.consent`) com a versão do texto aceito, porque sem
 * versão não há como demonstrar *a que* a pessoa consentiu — LGPD, art. 6º:
 * "X - responsabilização e prestação de contas: demonstração, pelo agente, da
 * adoção de medidas eficazes e capazes de comprovar a observância e o
 * cumprimento das normas de proteção de dados pessoais".
 *
 * A finalidade é uma só e cabe numa frase: comparar a preferência declarada
 * pela pessoa com o perfil da empresa de uma vaga a que ela se candidata,
 * para o analista decidir quais currículos encaminhar. LGPD, art. 6º: "I -
 * finalidade: realização do tratamento para propósitos legítimos,
 * específicos, explícitos e informados ao titular, sem possibilidade de
 * tratamento posterior de forma incompatível com essas finalidades".
 *
 * **A resposta é da pessoa e vale 12 meses** (`VALIDADE_DA_RESPOSTA_MESES`).
 * Dentro desse prazo ela vale para as outras candidaturas dela dentro do IEL,
 * e o questionário pergunta só o que falta. Isso é finalidade mais larga do
 * que a da versão anterior do aceite, então só vale para quem aceitou o texto
 * que a descreve — ver `VERSOES_DE_ACEITE_QUE_PERMITEM_REUSO`. O que muda de
 * empresa para empresa continua sendo o outro lado: o perfil dela e quais
 * frases ela escolheu.
 *
 * A coleta é o mínimo que essa finalidade exige: dez respostas numa escala de
 * cinco pontos. Nenhum texto livre, nenhum dado de contato novo, nenhuma
 * pergunta que não entre no cálculo — e, agora, nenhuma pergunta repetida:
 * perguntar de novo o que a pessoa já respondeu seria coletar duas vezes o
 * mesmo dado. LGPD, art. 6º:
 * "III - necessidade: limitação do tratamento ao mínimo necessário para a
 * realização de suas finalidades, com abrangência dos dados pertinentes,
 * proporcionais e não excessivos em relação às finalidades do tratamento de
 * dados". É por isso que o candidato responde 10 frases e não 52: uma por
 * tema que o motor de aderência usa. Frase a mais seria dado coletado sem uso.
 *
 * O resultado alimenta uma decisão sobre a pessoa, então ele precisa ser
 * explicável até a frase — LGPD, art. 20, § 1º: "O controlador deverá fornecer,
 * sempre que solicitadas, informações claras e adequadas a respeito dos
 * critérios e dos procedimentos utilizados para a decisão automatizada". Daí
 * `computeAdherence` devolver a conta aberta por tema e por frase, e não só o total.
 */

/** Versão do texto de aceite apresentado ao candidato (M7). */
/*
 * 2026-09-20: "percentual de aderência por eixo" virou linguagem de gente.
 * 2026-09-21: o instrumento mudou — de 5 perguntas de três alternativas para
 * 10 frases numa escala de concordância, escolhidas pela empresa da vaga. O
 * que se coleta mudou, então a versão sobe.
 * 2026-09-22: a resposta passa a ser da pessoa e a valer 12 meses, para ser
 * reaproveitada nas outras candidaturas dela dentro do IEL. Isso amplia a
 * finalidade e a retenção do que já era coletado — não dá para fazer isso
 * calado sobre um aceite que prometia o contrário. Versão nova, e reuso só
 * para quem aceitar esta.
 * 2026-09-23: o texto mostrado mudou de forma — um resumo de três linhas
 * (`CANDIDATE_CONSENT_RESUMO`) na frente e o texto inteiro atrás de um
 * toque — e de conteúdo: o desfazer deixa de ser "responda de novo" (a
 * resposta é uma só e vale 12 meses) e passa a ser "peça correção ou saída
 * pelo IEL". O que a pessoa lê e aceita é outro, então a versão sobe. As
 * duas versões anteriores continuam gravadas nas respostas que as aceitaram.
 */
export const CANDIDATE_CONSENT_VERSION = '2026-09-23';

/**
 * Versão do texto que vigorava antes de 2026-09-22.
 *
 * Existe porque a base fictícia tem resposta antiga, e uma resposta sem a
 * versão do texto que a autorizou é uma resposta que ninguém consegue
 * explicar depois. Ela também é a que **não** permite reaproveitamento: ver
 * `VERSOES_DE_ACEITE_QUE_PERMITEM_REUSO`.
 */
export const CANDIDATE_CONSENT_VERSION_ANTERIOR = '2025-04-10';

/**
 * Por quanto tempo a resposta de uma pessoa continua valendo.
 *
 * Doze meses é decisão do dono do produto, tomada em 19/09/2026, e está aqui
 * como constante justamente para continuar sendo decisão de alguém — como o
 * corte de 35% em `adherence.ts`.
 *
 * O porquê: o que a pessoa responde é **como ela prefere trabalhar**, e isso
 * é dela, não da vaga ("o que eu gosto ou não é o candidato" — Coringa,
 * 00:19:47). Preso à candidatura, o mesmo público operacional, com baixo
 * letramento digital e que trava em plataforma (00:08:01), responde as mesmas
 * frases de novo a cada vaga. Atrito no lugar mais caro do funil.
 *
 * O limite existe porque preferência de trabalho muda com a vida: guardar
 * para sempre seria retenção sem prazo, e LGPD, art. 15, diz que o
 * tratamento termina quando a finalidade se exaure. Vencida, a resposta é
 * como se não existisse — a frase volta a ser perguntada, e a aderência fica
 * sem base em vez de ser calculada sobre dado velho.
 */
export const VALIDADE_DA_RESPOSTA_MESES = 12;

/**
 * As versões de aceite que autorizam reaproveitar a resposta em outra
 * candidatura.
 *
 * Reaproveitar é finalidade nova ("outras candidaturas suas dentro do IEL") e
 * retenção nova (12 meses) sobre dado já coletado. LGPD, art. 8º, § 4º: "O
 * consentimento deverá referir-se a finalidades determinadas, e as
 * autorizações genéricas para o tratamento de dados pessoais serão nulas".
 * Quem aceitou o texto anterior aceitou o contrário disto — aquele texto
 * dizia que as respostas ficavam ligadas àquela candidatura. Então a resposta
 * dada sob texto antigo continua valendo para a candidatura em que foi dada,
 * e **nunca** é levada para outra: a frase volta a ser perguntada, sob o
 * texto novo. Aceite novo, reuso novo; nada retroage.
 */
export const VERSOES_DE_ACEITE_QUE_PERMITEM_REUSO: readonly string[] = [
  // 2026-09-22 já prometia os 12 meses e o reuso; 2026-09-23 só muda a forma
  // e o desfazer. Quem aceitou uma delas aceitou o reuso.
  '2026-09-22',
  CANDIDATE_CONSENT_VERSION
];

/** Se a resposta dada sob esta versão pode ir para outra candidatura. */
export function aceitePermiteReuso(version: string): boolean {
  return VERSOES_DE_ACEITE_QUE_PERMITEM_REUSO.includes(version);
}

function doisDigitos(valor: number): string {
  return String(valor).padStart(2, '0');
}

/**
 * Último dia em que uma resposta dada em `answeredAt` ainda vale (YYYY-MM-DD).
 *
 * Soma meses de calendário, não 365 dias: o aceite promete "12 meses", e é
 * assim que a pessoa conta. Dia 31 em mês de 30 cai no último dia do mês, que
 * é o comportamento que não inventa data inexistente.
 */
export function validaAte(answeredAt: string): string {
  const [ano, mes, dia] = answeredAt
    .slice(0, 10)
    .split('-')
    .map((parte) => Number(parte));
  if (!ano || !mes || !dia) return answeredAt.slice(0, 10);

  const deslocamento = mes - 1 + VALIDADE_DA_RESPOSTA_MESES;
  const anoFinal = ano + Math.floor(deslocamento / 12);
  const mesFinal = (deslocamento % 12) + 1;
  // Dia 0 do mês seguinte é o último dia do mês corrente.
  const ultimoDia = new Date(Date.UTC(anoFinal, mesFinal, 0)).getUTCDate();
  return `${anoFinal}-${doisDigitos(mesFinal)}-${doisDigitos(Math.min(dia, ultimoDia))}`;
}

/**
 * Se a resposta ainda vale na data de referência.
 *
 * `agoraIso` vem sempre do relógio determinístico da demonstração
 * (`state/storage.ts#nowIso`) ou de `DEMO_REFERENCE_DATE`. Comparação por
 * texto ISO: `YYYY-MM-DD` ordena igual como data e como string, e a
 * comparação é inclusiva no último dia — quem responde hoje tem os 12 meses
 * inteiros.
 */
export function respostaDentroDaValidade(
  answeredAt: string,
  agoraIso: string
): boolean {
  return agoraIso.slice(0, 10) <= validaAte(answeredAt);
}

/**
 * O texto que abre o questionário, antes da primeira pergunta.
 *
 * Cobre o que o art. 9º da LGPD manda informar de forma "clara, adequada e
 * ostensiva": finalidade específica, forma e duração, quem é o controlador,
 * com quem o dado é compartilhado e quais são os direitos do titular. Sem o
 * aceite o questionário não abre (seção 5.3 do documento de produto).
 *
 * `retention` e `rights` mudaram em 2026-09-22 e são o centro desta versão.
 * A resposta passou a valer 12 meses e a ser reaproveitada nas outras
 * candidaturas da pessoa dentro do IEL; a versão anterior prometia o oposto
 * ("ficam ligadas a esta candidatura e deixam de ser usadas quando a vaga se
 * encerra"). Reaproveitar sem trocar o texto seria tratar dado para
 * finalidade incompatível com a informada — LGPD, art. 6º, I — e quebrar a
 * promessa feita à pessoa. Os campos são os mesmos de antes de propósito:
 * o texto novo entra nas telas que já leem `retention` e `rights` sem
 * depender de ninguém lembrar de renderizar um campo novo.
 *
 * O prazo aparece em número ("12 meses") e o desfazer aparece em ação
 * ("peça correção", "peça para sair"), não em termo jurídico: quem lê é
 * público operacional com baixo letramento digital (00:08:01), e direito que
 * a pessoa não entende como exercer é direito que ela não tem.
 *
 * Desde 2026-09-23 o desfazer **não** é "responda de novo": a resposta é uma
 * só e vale 12 meses (decisão do dono do produto, 20/09/2026). Corrigir é
 * pedir ao IEL, pelo mesmo canal por onde o link chegou — e o reducer
 * continua aceitando a substituição, porque é o IEL quem a faria.
 */
export const CANDIDATE_CONSENT_TEXT = {
  version: CANDIDATE_CONSENT_VERSION,
  title: 'Antes de responder',
  purpose:
    'São frases sobre como você prefere trabalhar. Para cada uma, você diz o quanto concorda. As respostas servem só para comparar o seu jeito de trabalhar com o da empresa desta vaga.',
  collected:
    'Coletamos apenas o quanto você concorda com cada frase. Nada de saúde, família, religião, opinião política ou teste de personalidade.',
  whoSees:
    'Quem vê: a equipe do IEL que cuida desta vaga. Se o seu currículo for encaminhado, a empresa vê quanto você combina com ela em cada tema — nunca as suas respostas uma a uma.',
  retention:
    'As suas respostas são suas, não da vaga: ficam guardadas por 12 meses. Nesse tempo, se você se candidatar a outra vaga pelo IEL, a gente usa o que você já respondeu e pergunta só o que faltar. Depois de 12 meses elas deixam de ser usadas e as frases são perguntadas outra vez.',
  rights:
    'Você responde uma vez só. Pode ver o que está registrado sobre você, pedir correção ou pedir para sair — e aí as suas respostas deixam de ser usadas em qualquer vaga. É tudo com a pessoa do IEL que mandou este link.'
} as const;

/**
 * O aceite em três linhas, do jeito que a tela mostra antes da caixa "Li e
 * aceito": o que você responde e para quê, quem vê, por quanto tempo vale.
 *
 * É resumo do `CANDIDATE_CONSENT_TEXT`, não outro texto: o inteiro fica a um
 * toque ("Ler o texto completo") e é o que a versão gravada identifica. Os
 * dois andam juntos — mudou um, sobe `CANDIDATE_CONSENT_VERSION`.
 */
export const CANDIDATE_CONSENT_RESUMO: readonly string[] = [
  'Você diz o quanto concorda com cada frase. Serve só para comparar o seu jeito de trabalhar com o da empresa desta vaga.',
  'Quem vê é a equipe do IEL. A empresa nunca vê as suas respostas uma a uma.',
  'Vale por 12 meses, para esta e para outras vagas pelo IEL. Você responde uma vez só.'
];

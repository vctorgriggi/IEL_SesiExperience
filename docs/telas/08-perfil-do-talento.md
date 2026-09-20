# Perfil do talento

**Rota:** `/talentos/[talentId]` — com `?vaga=<jobId>` para ler o perfil no contexto de uma vaga
**Componentes:** `apps/dashboard/components/iel-demo/talents/talent-profile-screen.tsx`,
`talents/aderencia-da-pessoa.tsx`, `talents/leitura-por-tema.tsx`, `talents/talent-fit-view.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-20

## O que a tela faz

Reúne o que a base sabe sobre uma pessoa e responde, por padrão, a pergunta que faz o banco de
talentos valer: **em quais empresas ela se encaixa**. Até 19/09 a tela só respondia alguma coisa com
uma vaga no link; sem vaga ela dizia que compatibilidade depende da oportunidade e parava por aí. A
aderência é da cultura da empresa, não da vaga (00:31:38) — então ela existe para a pessoa mesmo
quando nenhuma vaga está aberta.

## O que aparece

**Cabeçalho** com iniciais no lugar de foto, função, cidade e a contagem de candidaturas. Com vaga
no contexto, entram as ações daquela vaga (voltar para a vaga, perguntar à pessoa, marcar para envio
respeitando o limite de cinco).

Abaixo, quatro abas — a terceira só existe com vaga no contexto:

- **Onde ela se encaixa** (abre por padrão) — a
  [análise de aderência](21-analise-de-aderencia.md) ancorada na pessoa: a lista de empresas
  comparadas com percentual, faixa e denominador, e, ao lado, a leitura completa da empresa aberta —
  radar dos dez temas, tema a tema com os dois lados escritos, divergência gestão × equipe e as
  vagas abertas daquela empresa. Com `?vaga=`, a leitura já abre na empresa daquela vaga.
- **Como ela prefere trabalhar** (`talents/leitura-por-tema.tsx`) — a leitura da pessoa **sem
  empresa do outro lado**, uma linha por tema, na ordem de `FIT_AXES`: um trilho de cinco pontos com o
  marcador onde a média dela caiu (verde-azulado, o lado da pessoa), a palavra da tendência num badge
  — **"Tende a"** (a mais de um ponto do meio), **"Pende um pouco"** (entre meio ponto e um ponto) ou
  **"No meio-termo"** (até meio ponto, em cinza) —, quantas frases sustentam aquilo, e a frase pronta
  em primeira pessoa que a própria pessoa recebeu na devolutiva do questionário
  (`analysis/leitura-pessoal.ts`, reaproveitada por `analysis/leitura-por-tema.ts`). No meio-termo, a
  nuance: "nem sempre é de um jeito só, e tudo bem". Tema sem frase respondida aparece como "Ainda
  não respondeu frase deste tema" — sem trilho e sem marcador, porque um ponto no meio diria "tanto
  faz". Quem nunca respondeu vê o aviso e o link para o questionário. No rodapé: "É o que ela
  respondeu, do seu jeito. Não é nota, e não muda com a empresa", e a validade das respostas.

  Vem **depois** da aderência, e não antes, porque a analista abre a pessoa para decidir sobre uma
  vaga: a comparação é o que decide, e a leitura só dela responde a pergunta seguinte — "e ela, o que
  disse de si?". É a resposta à pergunta do dono do produto ("na visão de quem?"): na dela.

- **Nesta vaga** (só com `?vaga=`) — a leitura por candidatura, em `talents/talent-fit-view.tsx`: os
  dois números lado a lado (combina com a empresa e requisitos da vaga), os dez temas, os requisitos,
  o sobre a pessoa e o histórico, mais o resumo em texto de `analysis/fit-insights.ts`. O componente
  troca o jargão do instrumento pelo vocabulário da tela na fronteira da apresentação: "eixo" vira
  "tema", "coleta dirigida" vira "pergunta à pessoa", "encaminhamento" vira "envio do currículo". O
  texto de origem mora em `features/`, que é domínio de outra mão; enquanto não for reescrito lá, a
  troca acontece aqui.
- **Candidaturas** — a jornada da pessoa: cada vaga, a empresa, o resultado e a data, com o link que
  reabre o perfil naquele contexto.

## De onde vêm os dados hoje

`getTalent`, `getApplicationsByTalent`, `getJob`, `getCompany`, `getTalentJourney`,
`getReferralListSelection` e `getAdherence` (por candidatura); a aba de aderência usa
`getCultureMapPoints`, `getCultureFit` e `getTalentCompanyAdherence`, todos memorizados por `state`.
A aba "Como ela prefere trabalhar" lê `getRespostasDaPessoa` (só respostas dentro da validade) e
`validadeDasRespostas`, e passa o `Record<itemId, valor>` a `leituraPorTema`.

## Ações do usuário

- Marcar para envio — `add-to-referral-list` (limite `REFERRAL_LIMIT`, cinco).
- Remover da lista — `remove-from-referral-list`.
- Trocar de aba e escolher a empresa da leitura — estado local, sem ação de reducer.

## Backend futuro

- Perfil consolidado a partir das fontes integradas, com precedência declarada quando duas fontes
  divergirem (hoje a divergência aparece como estado, e é assim que deve continuar).
- Nota interna vira registro com autoria e visibilidade garantida no servidor.
- Avaliações externas continuam preservando a escala de origem; nada é convertido em nota própria.

## Regras e limites

- Os temas descrevem **condição de trabalho**, nunca traço de personalidade ou dado de saúde.
- **A leitura por tema não é nota.** Nenhuma tela diz "boa", "ruim", "apta", "perfil" ou "score" de
  uma pessoa isolada (PRODUTO.md §11). O vocabulário é de tendência — para onde ela pende, nas
  palavras dela —, nenhum lado é melhor, os temas ficam na ordem fixa do instrumento e ausência de
  resposta nunca vira zero nem meio-termo.
- **Ordenar empresas para uma pessoa não é ranquear pessoas.** A lista de "melhores pessoas"
  continua não existindo, e o rodapé da aba diz isso.
- Nota interna é interna: não acompanha encaminhamento.
- Toda informação exibida aponta origem, fonte e data.
- O gestor não abre o perfil de uma pessoa: ele vê pessoas apenas dentro de uma remessa enviada
  pelo IEL.

## Ligações

Vem de: [Talentos](07-talentos.md), [Mesa de seleção](04-mesa-de-selecao.md),
[Comparação](05-comparacao.md), [Mapa de Cultura](15-mapa-de-cultura.md).
Entra em: [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md),
[Contexto da empresa](10-contexto-da-empresa.md).

## Histórico

- 2026-09-19 — criada, já com o bloco do Mapa de Cultura.
- 2026-09-19 — ganha abas e passa a abrir na **análise de aderência da pessoa**: em quais empresas
  ela se encaixa, e não só na vaga pela qual o link chegou. A tela deixou de depender de `?vaga=`
  para dizer alguma coisa.
- 2026-09-20 — entra a aba **"Como ela prefere trabalhar"**: a leitura da pessoa por tema sem
  empresa, com trilho, tendência em palavra e a frase da devolutiva. Responde "na visão de quem?"
  sem virar nota.

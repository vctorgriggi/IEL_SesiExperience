# Questionários

**Rota:** `/candidatos` (`?aba=analise` abre direto na análise)
**Componente:** `CandidatosScreen`, em
`apps/dashboard/components/iel-demo/metricas/candidatos-screen.tsx` (aba Simples em
`components/iel-demo/solicitacoes/solicitacoes-simples.tsx`, leitura em
`features/iel-demo/analysis/solicitacoes.ts`)
**Persona:** Analista IEL
**Última atualização:** 2026-09-20

## O que a tela faz

Responde duas perguntas sobre o questionário, em duas abas. **Simples** (abre por padrão): _de quem
o IEL está esperando resposta, desde quando, e o que fazer_ — é a lista de "ficar em cima"
(00:44:09), que antes estava espalhada pela mesa de seleção ("Sem resposta"), pela empresa ("Cobrar
N que faltam"), pelos Enviados ("Sem devolutiva há N dias") e pelo Acompanhamento ("ainda não
contou"). **Análise**: _o convite chega, é aberto e o questionário é concluído?_ — só agregados,
nenhum nome, e todo recorte com menos de 5 pessoas sai como "—".

## O que aparece

- **Cabeçalho**: "Questionários — De quem o IEL está esperando resposta, e como o questionário está
  indo", o botão **Ver como o candidato vê** (abre a candidatura de exemplo como chega no celular) e
  as abas **Simples · Análise**.

### Aba Simples

- **Quatro cartões**: **Esperando resposta** (tudo o que saiu e não voltou), **Vence hoje**
  (laranja quando há alguém), **Vencidos** (vermelho quando há alguém) e **Respondidos em 7 dias**
  (verde: questionários, consultas, devolutivas e check-ins que chegaram na semana).
- **Esperando de quem** — uma linha por espera, em quatro tipos:
  - **Questionário do candidato**: candidatura sem resposta resolvida (`getFitStatus` ≠
    respondido), de vaga não encerrada e cujo convite já saiu. Prazo: 2 dias da candidatura (R7 em PRODUTO.md; a tela diz só o prazo).
  - **Consulta ao colaborador**: convite em aberto (sem `answeredAt`), inclusive os vencidos. Prazo:
    `expiresAt` (3 dias do envio ou do último reenvio, R7). Sem nome: aparece o e-mail corporativo e
    a área.
  - **Devolutiva da empresa**: pessoa enviada numa remessa registrada sem "contratei / não
    contratei". Prazo: 15 dias do envio (R9). "Quem" é o contato do RH da empresa.
  - **Como está sendo**: contratado com marco (30/60/90) aberto e sem resposta, de
    `getAcompanhamento`. Prazo: os 30 dias da janela do marco.
- **Colunas**: Quem · O quê (tipo e vaga · empresa, ou pessoa enviada · vaga) · **Esperando** ("há
  3 dias", "enviado hoje") · **Prazo** em badge com palavra e cor ("vence em 1 dia" cinza, "vence
  hoje" laranja, "venceu há 2 dias" vermelho) · **Canal** (WhatsApp/E-mail, do convite; e-mail para
  colaborador e RH; WhatsApp para o check-in, que vai pela mensagem do Mind) · **Lembretes** ("2
  enviados · último há 1 dia", dos reenvios manuais) · **Próximo automático** ("em 3 h", "amanhã",
  "em 2 dias"; "nenhum, venceu" / "nenhum previsto") · **Ação**.
- **Ordem**: vencidos primeiro (o mais vencido no topo), depois vence hoje, depois no prazo (o mais
  próximo primeiro); empate por quem espera há mais tempo.
- **Filtros**: abas por estado (Todas · Vencidas · Vence hoje · No prazo, com contadores) e seletor
  por tipo (com contadores). Lista paginada de 30 em 30 ("Mostrar mais"): a base tem milhares de
  candidaturas.
- **No celular** (abaixo de `lg`) a tabela vira cartões empilhados, sem rolagem horizontal.
- **Uma linha de rodapé**: a regra do lembrete automático ("24 h depois do envio e 24 h antes do
  prazo, pelo mesmo canal e com o mesmo link"). Que o lembrete ainda não sai sozinho é registro
  interno (`docs/interno/o-que-e-simulado.md`), não texto de tela.
- **Vazio**: "Ninguém está devendo resposta ao IEL agora." / "Nada neste recorte. Tire um filtro
  para ver o resto."

### Aba Análise

O que a tela sempre foi: filtros de período, vaga e canal; quatro indicadores (abertura, conclusão,
tempo médio, consentimentos); **Funil da comunicação** (total / e-mail / WhatsApp) e **Onde o
candidato para**; **Privacidade por padrão**. Ver `analysis/analytics.ts`.

## De onde vêm os dados hoje

Aba Simples: `getSolicitacoes(state, agora)` em `analysis/solicitacoes.ts`, função pura sobre o
estado — nada é gravado. Lê `state.applications` + `getFitStatus`, o convite de cada candidatura
(`fixtures/outcomes.ts`, `comunicacao`, indexado uma vez), `state.fitReminders`,
`state.cultureInvites` (a hora do último reenvio vem do histórico "Convite reenviado", porque o
convite só guarda o contador), `getRegisteredReferrals` + `lerDevolutiva`, `getAcompanhamento`. O
"agora" é `nowIso()` fixado na abertura da aba: o dia decide "esperando há" e o prazo; a hora decide
qual lembrete automático é o próximo. Sem O(n²): cada fonte é percorrida uma vez com índices por
candidatura.

**Próximo automático** é calculado das datas: o primeiro entre `envio + 24 h` e `prazo − 24 h`
(prazo às 12:00 UTC, horário comercial) que ainda não passou. Não há agenda gravada nem envio.

Aba Análise: `getCandidatosKpis`, `getFunilDaComunicacao`, `getOndeOCandidatoPara`.

## Ações do usuário

- **Reenviar** (candidato) → `resend-fit-invite` com o canal do convite; a coluna Lembretes sobe
  na hora. Só existe quando o convite saiu.
- **Reenviar** (colaborador) → `resend-culture-invite`; o prazo ganha mais 3 dias.
- **Mensagem do Mind** (candidato) → gaveta do Mind na etapa `lembrete-questionario`; (contratado)
  → etapa `como-esta-sendo`.
- **Cobrar a empresa** (devolutiva) → gaveta do Mind na etapa **`cobrar-devolutiva`**, dirigida ao
  RH: a mensagem nomeia a empresa e a pessoa enviada (é comunicação IEL → empresa; R5 não se
  aplica), diz há quantos dias espera e leva o link do relatório
  (`routes.dashboard.iel.report.byToken`). Nada é gravado: a analista copia e manda; não existe
  ação de reducer que registre a cobrança, então "Lembretes" fica "nenhum" nessa linha.
- Trocar de aba, filtrar por estado e tipo, "Mostrar mais" — estado local.

A etapa `cobrar-devolutiva` vale também em `/api/iel/mensagens` (`empresa`, `pessoaEnviada` e
`diasEsperando` no corpo); no provedor de IA eles saem como `[empresa]` e `[pessoa]`, e voltam ao
lugar no servidor depois da validação (PRODUTO.md §5.8).

## Backend futuro

- A lista lida de um serviço de pendências com o "hoje" real e os envios reais (e-mail/WhatsApp).
- Lembretes automáticos de verdade, nos horários da regra, com registro de cada envio (canal,
  hora, entrega) — hoje só a regra e o cálculo existem.
- Registro da cobrança à empresa como evento do IEL (quem cobrou, quando, por onde), para a coluna
  Lembretes valer também para a devolutiva.

## Regras e limites

- R7 (2 dias candidato, 3 colaborador) e R9 (15 dias para a devolutiva) definem os prazos; quem
  venceu continua na lista até responder ou a analista decidir — sair sozinho seria sumir em
  silêncio.
- Colaborador nunca aparece com nome (PRODUTO.md §5.2): só e-mail corporativo e área.
- Nada é enviado pela tela sozinho; o lembrete automático ainda é simulado, e a tela não diz isso —
  fala só do prazo e do próximo passo.
- Texto de tela em palavra de gente: "esperando há 3 dias", "vence hoje", "venceu há 2 dias" — sem
  "SLA", "pendência" ou "solicitação".
- Aba Análise: nenhum nome, nenhum contato; recorte com menos de 5 pessoas sai como "—".

## Ligações

Entra por: menu **Talentos → Questionários** e pelo tour guiado (que abre em `?aba=analise`). Sai
para: a gaveta do Mind, [Minha candidatura](23-minha-candidatura.md) ("Ver como o candidato vê") e
[Talentos](07-talentos.md) ("Ver pessoas").

## Histórico

- 2026-09-20 — criada. A tela ganhou a aba **Simples** (lista de quem deve resposta, com prazo,
  canal, lembretes, próximo automático e ações) e a analítica passou a ser a aba **Análise**,
  intacta. Etapa `cobrar-devolutiva` na mensagem do Mind.

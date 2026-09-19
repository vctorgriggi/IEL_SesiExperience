# Mind RH — Central de Seleção do IEL

> Fit cultural na triagem do Centro de Empregos da Indústria, sem custo por candidato: a empresa vira um perfil respondido pela própria equipe, o candidato responde ao se candidatar, e a analista do IEL vê requisitos e fit lado a lado para escolher os 5 currículos.

Protótipo navegável construído no hackathon do **Desafio IEL** (19–20/09/2026) pela equipe **Madvic**. Vive dentro do starter kit Arki, em `app/apps/dashboard`, sob a rota `/iel`. É uma implementação funcional de interface, com base fictícia determinística — não um deck, não um recorte de telas.

## Sumário

- [O problema, nas palavras do cliente](#o-problema-nas-palavras-do-cliente)
- [O que o Mind RH faz](#o-que-o-mind-rh-faz)
- [Três papéis, três produtos](#três-papéis-três-produtos)
- [As telas](#as-telas)
- [O motor de aderência](#o-motor-de-aderência)
- [Regras de negócio do cliente que o protótipo cumpre](#regras-de-negócio-do-cliente-que-o-protótipo-cumpre)
- [Privacidade por padrão](#privacidade-por-padrão)
- [Integração de IA](#integração-de-ia)
- [Entrada de dados: Empregare](#entrada-de-dados-empregare)
- [Design e marca](#design-e-marca)
- [Arquitetura técnica](#arquitetura-técnica)
- [Como rodar](#como-rodar)
- [Testes](#testes)
- [Roteiro de demonstração](#roteiro-de-demonstração)
- [Base de dados fictícia](#base-de-dados-fictícia)
- [Fora do MVP e por quê](#fora-do-mvp-e-por-quê)
- [Limitações honestas](#limitações-honestas)
- [Documentação](#documentação)

## O problema, nas palavras do cliente

O Centro de Empregos da Indústria (IEL-MT) trabalha **25 mil vagas por ano**, atrai candidatos e encaminha até 5 currículos por vaga para a indústria escolher. O turnover é alto — "tem indústria que abre 30 vagas, no próximo mês abre 30 vagas; frigorífico abre 700 e no próximo mês 500" — e o IEL sabe por quê: "a gente contrata pelo currículo, tecnicamente, mas demite por comportamento. É 100%."

O que existe não serve: o fit da plataforma de vagas custa **R$ 100 por candidato**; a Mindsight, que "super funciona", foi abandonada por custo. O processo atual junta três relatórios num Excel montado à mão. A equipe do IEL pediu algo **integrado ao Empregare** (a base de currículos continua lá), com **custo marginal zero**, e que **não crie nenhuma etapa nova para a empresa** — "se colocar mais uma etapa, eles não fazem".

Fonte: transcrição da reunião de 19/09 e documentos de entendimento em [`docs/cliente/`](docs/cliente/00-indice.md).

## O que o Mind RH faz

1. **A empresa vira um perfil.** A analista cadastra uma amostra de colaboradores (nome e e-mail corporativo, ~20% da área da vaga e áreas conexas). Cada um recebe um link sem login e responde, em 5 minutos no celular, cinco perguntas sobre **como se trabalha ali de verdade** — apoio no início, quem organiza o trabalho, como chegam as tarefas, horário, o que se aprende. O perfil da empresa é a **média** dessas respostas, com mínimo de 3 respostas da equipe por ponto e prazo de 3 dias.
2. **O candidato responde na candidatura.** Ao se candidatar à vaga daquela empresa, recebe um link e responde as mesmas cinco perguntas, em linguagem simples, sem login, sem ver o nome da empresa.
3. **A analista decide numa tela só.** A vaga mostra os candidatos com **requisitos da vaga** (o match técnico que vem do Empregare) e **quanto combinam com a empresa** (aderência por ponto e total), corte de **35%**, resgate de quem o filtro técnico descartou mas combina, e marcação de até 5 currículos para envio.
4. **A empresa recebe os 5 currículos** numa página de leitura por link, com o percentual e os cinco pontos de cada pessoa, para escolher quem entrevistar. Nada de painel, nada de login.

## Três papéis, três produtos

Só a analista tem app. Empresa e candidato recebem links: uma tarefa por link, no celular, sem login, sem menu.

| Papel | Entrada | O que vê | O que não vê |
| --- | --- | --- | --- |
| **Analista do IEL** | app, desktop | tudo; é quem responde pelo dado | respostas individuais dos colaboradores da empresa (só a média) |
| **Empresa** (RH, gestão, colaboradores) | dois links, sem login | o colaborador: 5 perguntas sobre a própria empresa; o RH: os 5 currículos enviados com % e pontos | outras empresas, candidatos não enviados, respostas individuais |
| **Candidato** | link na candidatura, celular | 5 perguntas, confirmação, "o que está registrado sobre você" | o nome da empresa, o próprio %, o ranking, outros candidatos |

## As telas

Analista (`/iel`, com sidebar):

| Rota | Tela | Pergunta que responde |
| --- | --- | --- |
| `/iel` | Hoje | O que precisa de mim hoje? |
| `/iel/vagas/[jobId]` | Vaga | Quem eu envio para esta vaga? — section cards, tabela de candidatos (Sugeridos · Todos · Resgate · Sem resposta), abas Como a empresa trabalha · Perguntas · Enviados · Requisitos · Histórico |
| (Drawer sobre a vaga) e `/iel/talentos/[talentId]?vaga=` | Pessoa | Esta pessoa combina com esta empresa? — % com marca do 35%, os 5 pontos com empresa ■ e pessoa ● |
| `/iel/empresas/[companyId]` | Empresa | Como se trabalha nesta empresa? — respostas N de M, os 5 pontos com gestão/equipe/média, colaboradores convidados, cobrar quem falta |
| `/iel/vagas/[jobId]/importar` | Importar planilha | Entrou tudo certo? — três passos: enviar, conferir, pronto |
| `/iel/vagas/[jobId]/comparar`, `/iel/talentos`, `/iel/empresas`, `/iel/pendencias`, `/iel/encaminhamentos`, `/iel/fontes-de-dados` | listas e apoio | |

Por link (casca mínima, sem sidebar):

| Rota | Quem | O quê |
| --- | --- | --- |
| `/iel/candidatura/[applicationId]/fit` | candidato | aceite → 5 perguntas → pronto → o que está registrado sobre você |
| `/iel/consulta/[token]` | colaborador da empresa | aceite → 5 perguntas → resposta registrada (token opaco, 3 dias, uso único) |
| `/iel/relatorio/[token]` | RH da empresa | os 5 currículos enviados, com % e os 5 pontos por pessoa |

## O motor de aderência

Cada ponto do dia a dia tem três opções ordenadas (1, 2, 3). A empresa tem, por ponto, a **média** das respostas da amostra; o candidato, a opção que marcou. A aderência no ponto é

```
aderência = 100 × (1 − |média da empresa − resposta do candidato| / 2)
```

e o total é a média ponderada dos pontos que têm os dois lados (pesos por vaga: alto 3, médio 2, baixo 1). **Ponto sem resposta de um dos lados não conta contra ninguém** — o denominador ("medido em 2 de 5 pontos") fica visível ao lado do número. O corte é **35%**, o número que o IEL usa; abaixo dele a pessoa aparece como "abaixo do mínimo", nunca some da lista. Código em `features/iel-demo/analysis/adherence.ts`, com testes.

**Por que não é teste psicométrico.** As cinco perguntas descrevem condições de trabalho observáveis, não traços de personalidade nem saúde. O produto compara o que a empresa diz de si com o que a pessoa diz de si, nos mesmos termos. A decisão continua da analista: nenhuma tela escolhe sozinha, e o resumo assistido cita os registros que usou.

## Regras de negócio do cliente que o protótipo cumpre

Extraídas dos documentos de 19/09 ([`docs/cliente/00-indice.md`](docs/cliente/00-indice.md), com timestamp na transcrição):

| # | Regra | Onde |
| --- | --- | --- |
| R1 | Fit é sobre a cultura da empresa, não sobre a vaga | perfil por empresa; a vaga só dá os pesos |
| R2 | Perfil é a média de uma amostra de colaboradores; RH sozinho não responde pela empresa | `MIN_TEAM_RESPONSES = 3`, amostra sugerida de 20% |
| R3 | Aderência mínima de 35% | `ADHERENCE_THRESHOLD` |
| R4 | O candidato responde ao se candidatar | link por candidatura |
| R5 | O nome da empresa não aparece para o candidato | `getCandidateJobView`: atividade, cidade, setor, turno |
| R6 | Máximo de 5 currículos por vaga | `REFERRAL_LIMIT` |
| R7 | Custo marginal zero | motor, ranking e questionários sem IA paga |
| R8 | Empregare continua sendo a base | importação de planilha; contrato para API/webhook |
| R9 | Nenhuma etapa nova para a empresa sem a analista por perto | sem painel; dois links |
| R10 | Candidato operacional, celular, sem login | telas por link, uma pergunta por tela, alvos de 48px |
| R11 | Prazos: 3 dias para a amostra, 2 para o candidato | convites e status de resposta |
| R12 | LGPD: aceite no questionário; só nome e e-mail corporativo | texto de aceite versionado nos dois questionários |

## Privacidade por padrão

[`docs/PRODUTO.md`](docs/PRODUTO.md) §5 é a referência (escrita com a skill `privacy-by-design-lgpd`, texto literal da LGPD). Em resumo, o que está implementado:

- **Minimização**: o colaborador entra com nome, e-mail corporativo, área e papel; o token do link não contém nada disso. O candidato não vê a empresa; a empresa não vê candidatos que não recebeu.
- **Agregação**: respostas de colaboradores só existem para a tela como média por ponto; a analista vê "7 de 10 responderam", nunca quem respondeu o quê.
- **Transparência**: o candidato tem, no mesmo link, "O que está registrado sobre você" — origem e data de cada registro e para quem o perfil foi enviado.
- **Aceite**: os dois questionários abrem com o aceite em linguagem simples (finalidade, o que se coleta, quem vê, prazo, direitos), versionado (`CANDIDATE_CONSENT_VERSION`, `CULTURE_CONSENT_VERSION`).
- **Decisão humana**: nenhuma sugestão da análise vira dado sem confirmação; nenhum candidato é eliminado automaticamente.

O que ainda depende de servidor e fica documentado como limite: validade e uso único dos links do candidato (hoje só o do colaborador tem), e o token da candidatura na URL.

## Integração de IA

A análise assistida roda por padrão em modo **determinístico e curado**: monta texto a partir dos registros efetivamente selecionados na tela (nunca do estado inteiro), sem consultar modelo de linguagem. Isso cumpre a exigência de custo marginal zero e de não exigir chave de API para a experiência principal.

A camada de provider vive em `app/apps/dashboard/features/iel-demo/ai/`:

- `types.ts` — contrato Zod entre a UI e qualquer provider (`AssistantRequest`/`AssistantResponse`), com o schema de saída aceito de um modelo real restrito a texto e citações — sem nota, sem ranking.
- `provider.ts` — a interface `AssistantProvider`.
- `deterministic-provider.ts` — o provider padrão, sem rede.
- `anthropic-provider.ts` — adapter para a API da Anthropic (`@anthropic-ai/sdk`, `claude-sonnet-5`), que valida a resposta contra o mesmo schema.
- `build-request.ts` — monta o pedido só com os registros selecionados (minimização).
- `index.ts` — `getAssistantProvider()`, que escolhe pelo ambiente e nunca falha por falta de configuração.

A rota `POST /api/iel/assistant` expõe o provider escolhido. Para ligar o modelo real: `IEL_AI_PROVIDER=anthropic` e `ANTHROPIC_API_KEY`. A IA fica **fora do caminho crítico**.

## Entrada de dados: Empregare

Hoje a entrada é a planilha que o IEL já exporta (vaga + candidatos + match técnico), importada em três passos com conferência antes de gravar e reimportação idempotente (`analysis/spreadsheet-import.ts`, planilha de exemplo em `fixtures/planilha-exemplo.csv`). A Empregare anuncia API pública e webhooks, mas ninguém confirmou o que ela expõe nem se o plano do IEL inclui; por isso a API é a fase 3 do roadmap. O contrato de evento futuro (`candidatura.criada`, `match.calculado`) está documentado no topo do mesmo arquivo com o **mesmo shape** da linha importada — trocar planilha por webhook não muda o reducer.

## Design e marca

A interface segue a **filosofia shadcn**: componentes de fábrica, sem estilo próprio por cima; estrutura por borda e espaço, não por cor; corpo em 14px; detalhe em Drawer, dados em tabela, números em section cards. As referências são os blocks oficiais `dashboard-01` e `sidebar-07`, lidos no código-fonte do registry. Os princípios de conteúdo (uma pergunta por tela, um número, uma ação, glossário sem jargão) e a diretriz visual estão em [`docs/DESIGN.md`](docs/DESIGN.md).

A marca é a do produto **Mind RH**, da Madvic (manual em [`docs/marca/`](docs/marca/)): azul-noite `#12182B`, marfim `#F4F1EA`, areia `#E9E5DB`, ardósia `#5B6072` e laranja `#FF5A36` só como ponto de atenção — mapeados nos tokens do shadcn, não em classes novas. Fonte Red Hat Display. O IEL continua sendo quem fala com o candidato ("Centro de Empregos"); a marca do produto aparece na sidebar e nas telas por link.

## Arquitetura técnica

- **Monorepo** Bun + Turborepo (starter kit Arki). O protótipo inteiro vive em `apps/dashboard`; os componentes shadcn entraram em `packages/ui/src/components/shadcn/*` (`@workspace/ui/shadcn/<nome>`), sem tocar o kit próprio nem o tema âmbar do resto do produto.
- **Next.js 15** (App Router), rota isolada em `app/(iel)/iel`, tema escopado em `[data-iel-theme]`, sem autenticação.
- **Estado client-side**: reducer + `localStorage` com persistência por delta e throttle; um relógio único da demonstração (`nowIso()` ancorado em `DEMO_REFERENCE_DATE`) para prazos da base fictícia não vencerem sozinhos.
- **Seletores puros** (`state/selectors.ts`) são a única forma como as telas leem dados.
- **Domínio** em `features/iel-demo/`: `types.ts`, `fixtures/` (núcleo curado + gerador determinístico), `analysis/` (aderência, cultura, convites, importação, relatório, assistente), `ai/`, `copy.ts` (glossário em código).

```
app/apps/dashboard/
├── app/(iel)/iel/              # rotas, layout, tema escopado (Mind RH)
├── components/iel-demo/        # layout (sidebar, header, diálogos), overview,
│                                #   selection, talents, companies, candidate,
│                                #   import, referrals, clarifications, sources
├── features/iel-demo/          # types, fixtures, analysis, state, ai, copy
└── public/marca/               # símbolo e wordmark
app/packages/ui/src/components/shadcn/   # componentes shadcn (new-york)
```

## Como rodar

Sem Postgres: o protótipo é inteiramente client-side.

```bash
bun install
bun run quickstart
bun --filter @workspace/dashboard dev
```

Abrir [http://localhost:3000/iel](http://localhost:3000/iel). Comandos: `bun run typecheck`, `bun run lint`, `bun run format`, `bun --filter @workspace/dashboard test`. O repo usa `bun --filter <workspace> <script>` (o Bun 1.4 removeu `--cwd`).

## Testes

Unitários (Vitest): `bun --filter @workspace/dashboard test` — **28 arquivos, 231 testes** no momento deste README. Cobrem o motor de aderência (fórmula, pesos, denominador, corte), o ranking, o parser e o plano de importação (separadores, BOM, %, idempotência), os convites (token, expiração, uso único, reenvio, amostra), o relatório para a empresa (faixas, token opaco), o glossário, a persistência e a base determinística (núcleo curado intacto sob o volume gerado).

E2E (Playwright, `e2e/iel-demo/`): existem oito cenários de jornada; no hackathon o foco foi visual e eles não foram mantidos em dia com a última rodada de telas. Não fazem parte do critério de pronto desta entrega.

## Roteiro de demonstração

Embutido na interface (sidebar → "Roteiro da demo"), em duas versões: **completo, 8 passos** e **curto, 4 paradas**. O caminho curto:

1. **Importar** a planilha de exemplo na vaga Assistente de Logística (`/iel/vagas/VAG-01/importar`) — entram 8 pessoas, uma tem o match atualizado, uma é ignorada.
2. **Vaga**: os section cards, a tabela com Sugeridos e Resgate, abrir Helena no Drawer, marcar 5 e enviar.
3. **Responder como colaborador** pelo link (`/iel/consulta/418c781c386bb301`): o contador da empresa passa de 7 para 8 de 10.
4. **Ver o relatório que a empresa recebe** (`/iel/relatorio/<token da vaga>`), depois de registrar o envio.

O roteiro completo passa ainda pela pessoa na página cheia, pela empresa (cobrar quem falta, confirmar sugestões), pelo candidato no celular (`/iel/candidatura/CAND-05/fit`) e pela persona do gestor.

## Base de dados fictícia

- **Núcleo curado** — 3 empresas, 3 vagas, 8 talentos, 10 candidaturas, convites e respostas de cultura coerentes entre si (Cerrado Distribuição com 7 de 10 respostas e prazo vencendo; Oficina Pantanal com 3 de 8 e prazo vencido).
- **Volume gerado** — 15 empresas, 39 vagas, 268 talentos, 635 candidaturas (`fixtures/generated.ts`), 90 sobre a vaga do roteiro. Determinístico (`SEED = 20260914`, `mulberry32`, datas derivadas de `DEMO_REFERENCE_DATE`), IDs com prefixo `GEN-`.

Sem volume, a triagem não precisa de ferramenta; com ele, tabela, filtros e resgate deixam de ser decorativos. Toda a base é sintética, com contatos em `example.com`.

## Fora do MVP e por quê

Segue o MoSCoW do cliente ([`docs/cliente/01-prioridade-funcionalidades-moscow.md`](docs/cliente/01-prioridade-funcionalidades-moscow.md)): API da Empregare (C1), assistente conversacional para o candidato (C2), devolutiva de um clique do RH (C3), validade do perfil cultural (C4), painel gerencial (C6). Won't: substituir o Empregare, prova de conhecimento, perfil comportamental completo, entrevista por IA, login para a empresa.

## Limitações honestas

- Estado local no navegador; não há servidor. Por isso o link do candidato leva o id da candidatura na URL e não expira — token opaco e uso único, como no link do colaborador, dependem de backend.
- O resumo assistido é texto por regra fixa por padrão; o adapter Anthropic existe e é opcional.
- A persona "Ver como" separa dados por papel dentro do estado local; não é autenticação.
- A escala ordinal de três pontos produz empates no ranking (vários 86%); é o esperado com cinco perguntas curtas, e a ordem secundária é pelos requisitos.
- Os testes e2e ficaram para trás na última rodada visual.

## Documentação

- [`docs/PRODUTO.md`](docs/PRODUTO.md) — referência do produto: fontes, princípios, regras R1–R12, privacidade por padrão, contradições e plano.
- [`docs/DESIGN.md`](docs/DESIGN.md) — princípios de interface, glossário e diretriz visual (shadcn + marca).
- [`docs/cliente/`](docs/cliente/00-indice.md) — MoSCoW, entendimento do desafio e transcrição da reunião de 19/09.
- [`docs/marca/`](docs/marca/) — manual de marca Madvic / Mind RH e logos.
- [`app/docs/`](app/docs/) — padrões de código e de git do repositório.

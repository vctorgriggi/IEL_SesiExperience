# Central de Seleção IEL — protótipo

> Uma central para o IEL reunir os dados de talentos, vagas e empresas, entender compatibilidades e conduzir uma seleção fundamentada.

Protótipo navegável construído para o hackathon do desafio **"Conectar talentos e empresas de forma que dê certo para os dois lados"** (IEL). Vive dentro do starter kit Arki, em `app/apps/dashboard`, sob a rota `/iel`. É uma implementação funcional de interface — não uma landing page, não um deck de slides, não um recorte de imagens de tela.

## Sumário

- [O problema](#o-problema)
- [Como o protótipo responde a cada critério de resolução](#como-o-protótipo-responde-a-cada-critério-de-resolução)
- [A tese do produto: fit sem nota, sem teste psicométrico](#a-tese-do-produto-fit-sem-nota-sem-teste-psicométrico)
- [Como funciona: as telas e o fluxo](#como-funciona-as-telas-e-o-fluxo)
- [Decisões de design responsáveis](#decisões-de-design-responsáveis)
- [Roteiro de demonstração](#roteiro-de-demonstração)
- [Base de dados fictícia](#base-de-dados-fictícia)
- [Integração de IA](#integração-de-ia)
- [Arquitetura técnica](#arquitetura-técnica)
- [Como rodar](#como-rodar)
- [Testes](#testes)
- [Fora do MVP e por quê](#fora-do-mvp-e-por-quê)
- [Referência de mercado](#referência-de-mercado)
- [Limitações honestas](#limitações-honestas)

## O problema

Nas palavras do próprio desafio (`docs/enunciado/01-desafio-e-contexto.md`): o IEL já dispõe de informações sobre talentos, vagas e empresas, mas elas não estão integradas numa jornada única. O Empregare divulga oportunidades e faz o matching técnico inicial; a avaliação de **fit cultural** roda numa plataforma externa contratada à parte, aplicada só depois da triagem técnica, "em razão dos custos envolvidos e da necessidade de etapas adicionais". O resultado: informação fragmentada entre ferramentas, esforço manual para juntar tudo, e uma análise de aderência que existe, funciona, mas não escala.

`docs/enunciado/07-ja-sabemos-que.md` é explícito sobre isso: o fit cultural "apresentou resultados positivos", mas tem quatro limitações nomeadas — custo alto, tempo elevado, dificuldade de aplicação em escala e o fato de viver "numa plataforma externa e separada dos demais processos". O desafio não pede para descartar a abordagem; pede para "ampliar essa abordagem, reduzir suas limitações e integrá-la a uma jornada centralizada".

## Como o protótipo responde a cada critério de resolução

`docs/enunciado/06-problema-considerado-resolvido.md` lista seis critérios. Cada um tem um recorte concreto no protótipo:

| Critério do enunciado | Onde aparece no protótipo |
| --- | --- |
| **Qualidade das conexões** — considerar informações além dos requisitos técnicos | Cada candidatura é lida em três dimensões (técnica, profissional, organizacional), nunca só currículo × requisito. Ver a matriz de candidatos na mesa de seleção (`/iel/vagas/[jobId]`). |
| **Integração das informações** — organizar dados de talentos, vagas e empresas de forma estruturada | Toda evidência carrega origem, natureza e data (`features/iel-demo/types.ts`, tipo `Evidence`); o perfil consolidado e a mesa de seleção mostram quantos registros e de quantas fontes cada análise reúne (seletores `getSourceBreakdown`, `getEvidencesForJob`, `getEvidencesForApplication` em `state/selectors.ts`). |
| **Eficiência do processo** — reduzir esforço manual e dependência de múltiplas ferramentas | A tela **Fontes de dados** (`/iel/fontes-de-dados`) simula o recebimento de atualizações de sistemas hoje separados (Empregare, avaliação externa, contexto da empresa, registro IEL) num único lugar, sem duplicar candidato ou candidatura no reprocessamento. |
| **Capacidade de escala** — ampliar o volume avaliável | A vaga do roteiro (`VAG-01`) tem 90 candidaturas geradas; a mesa de seleção pagina a matriz e oferece um filtro de triagem por lacuna ("Requisito obrigatório sem informação", "Divergência", "Cobertura completa") para tornar 90 linhas navegáveis sem abrir perfil por perfil. |
| **Apoio à tomada de decisão** — informação qualificada para RH, gestores, empresas e talentos | Área de análise assistida por vaga ("Resumir esta seleção", "Comparar os selecionados", "Mostrar o que falta esclarecer"), painel de evidências por critério, e a visão do gestor (`/iel/encaminhamentos/[referralId]`, persona "Visualizar como") para registrar interesse em entrevista. |
| **Transparência dos critérios** — nada de mecanismo opaco quando há recomendação | Nenhum critério tem estado sem explicação: cada estado (alinhamento, a esclarecer, divergência, sem informação, não se aplica) tem ícone, rótulo e nota, nunca só cor (`analysis/criterion-states.ts`). Não existe nota global nem ranking em nenhuma tela. |
| **Aprendizado contínuo** — usar resultados de processos para melhorar as próximas conexões | O perfil do talento mostra a trajetória da pessoa entre candidaturas de vagas diferentes, com o resultado de cada processo, e sinaliza quando o mesmo registro (ex.: uma experiência do currículo) já sustentou critérios em mais de uma vaga (`getReuseAcrossApplications`/trilha de trajetória em `state/selectors.ts`, tela `/iel/talentos/[talentId]`). |

### Estados de compatibilidade, não notas

Cada critério de uma candidatura assume um de cinco estados — nunca uma cor isolada, sempre com ícone e texto (`analysis/criterion-states.ts`):

- **Alinhamento identificado** — existe informação que sustenta a relação.
- **Ponto a esclarecer** — a interpretação ou condição precisa ser confirmada.
- **Divergência identificada** — há informações explícitas em conflito.
- **Sem informação** — não há base suficiente para analisar.
- **Não se aplica** — critério fora do escopo daquela vaga.

Uma divergência negociável e um requisito obrigatório não atendido têm consequências diferentes na interface, mas nenhum dos dois elimina a candidatura automaticamente — ambos abrem uma decisão para o analista registrar.

## Papéis e personas da demonstração

Não há autenticação real dentro do protótipo. Uma barra discreta fora da navegação normal, rotulada **"Visualizar como — demonstração"**, alterna entre personas para mostrar os limites de acesso que o produto pretende ter em produção:

| Persona | O que vê e faz na demonstração |
| --- | --- |
| Analista IEL | Vagas e candidaturas das empresas atendidas na base demo; todas as fontes autorizadas; comparação; pendências; preparação e registro de encaminhamento. |
| Gestora/gestor de uma empresa (ex.: Cerrado Distribuição, Horizonte Alimentos) | Apenas a própria empresa e os perfis compartilhados em encaminhamentos; responde pendências da equipe; indica interesse em entrevistar. |
| Candidato | Sua solicitação e resposta de esclarecimento, e o que existe sobre si (origem, data, destinos de encaminhamento); nenhuma informação sobre outros candidatos ou avaliações internas. |

Trocar para a persona de uma empresa nunca expõe a base completa do IEL nem dados de outra empresa — é uma restrição de dado dentro do estado local, não uma prova de segurança de produção, e o rótulo da barra diz isso explicitamente.

## A tese do produto: fit sem nota, sem teste psicométrico

O enunciado dedica uma página inteira ao fit cultural e conclui que ele funciona, mas não escala porque depende de aplicação individualizada, cara e demorada numa ferramenta separada. A tese deste protótipo é que **nada disso é inerente ao fit em si — é inerente a como ele é coletado hoje**.

Em vez de aplicar um novo instrumento psicométrico, o protótipo descreve os dois lados da relação nos mesmos termos, a partir do que já foi informado:

- A **empresa** (gestão, RH e a própria equipe) responde, eixo a eixo, como o trabalho de fato acontece: apoio nas primeiras atividades, autonomia na execução, comunicação de prioridades, previsibilidade de turno, aprendizado (`analysis/fit-axes.ts`).
- A **pessoa** registra, nos mesmos cinco eixos, o que prefere ou espera (`preferences` no tipo `Talent`).
- A leitura de fit compara os dois lados eixo a eixo — nunca produz uma nota única, nunca soma nem tira média entre eles.

**Por que sem nota global.** O enunciado pede transparência de critérios e veda "mecanismos opacos ou de difícil interpretação" quando há recomendação; também exige que a decisão continue humana. O briefing reforça o argumento: cobertura de dados ("6 de 8 critérios têm informação suficiente") não é probabilidade de sucesso nem qualidade da pessoa — é só uma medida de quanto já se sabe. Uma nota única obrigaria a inventar pesos entre dimensões que o enunciado nunca definiu, e esconderia divergências que o analista precisa ver para decidir. Por isso a matriz por dimensão substitui o placar: mais explicável, e não fabrica precisão que a base não tem.

## Como funciona: as telas e o fluxo

Onze telas, roteadas sob `/iel`, na ordem em que o analista costuma percorrê-las:

1. **Visão geral** (`/iel`) — indicadores calculados (vagas abertas, candidaturas em análise, pendências, encaminhamentos aguardando retorno), vagas que precisam de ação e cobertura de informação por dimensão.
2. **Vagas** (`/iel/vagas`) — lista com busca, filtro e a ação central "Abrir seleção".
3. **Mesa de seleção da vaga** (`/iel/vagas/[jobId]`) — a tela principal. Matriz de candidatos com estado por dimensão, **triagem por lacuna em escala** (o filtro que separa as 90 candidaturas de VAG-01 por requisito obrigatório não sustentado, divergência ou cobertura completa), seleção para comparação (até três) e área de análise assistida contextual à seleção atual.
4. **Perfil consolidado do talento** (`/iel/talentos/[talentId]`) — experiências, expectativas, avaliação externa (quando existe, com escala e método preservados), **traçado de fit eixo a eixo com o que a empresa declarou e o que a pessoa declarou**, e a **trajetória da pessoa entre processos** diferentes, incluindo registros reaproveitados entre vagas.
5. **Comparação entre candidatos** (`/iel/vagas/[jobId]/comparar`) — dois ou três lado a lado, critério por critério, com evidência por célula.
6. **Contexto da empresa e da equipe** (`/iel/empresas/[companyId]`) — descrição institucional separada das condições confirmadas pela equipe; é aqui que o **traçado cultural com múltiplos respondentes** (gestão, RH, equipe) e a **detecção de divergência** entre eles ficam visíveis, eixo a eixo.
7. **Pendências e esclarecimentos** (`/iel/pendencias`) — solicitações agrupáveis por destinatário/vaga; a IA propõe o texto da pergunta, o analista revisa antes de enviar.
8. **Experiência do destinatário** (`/iel/pendencias/[clarificationId]/responder` e a visão do gestor em `/iel/encaminhamentos`) — telas curtas de resposta, para gestor e para candidato, sem virar entrevista completa.
9. **Preparação e registro de encaminhamento** (`/iel/vagas/[jobId]/encaminhamento`) — lista de candidatos para uma vaga, resumo revisável, exclusão padrão de notas internas.
10. **Visão da empresa/gestor** (`/iel/encaminhamentos/[referralId]`) — o gestor vê o que foi compartilhado e registra "Quero entrevistar", "Solicitar esclarecimento" ou "Não avançar".
11. **Fontes de dados** (`/iel/fontes-de-dados`) — status de cada fonte simulada, simulação de recebimento de atualização, sem duplicar registros no reprocessamento.

Fio condutor comum a várias telas: a **devolutiva ao candidato**. No perfil visto pela persona do próprio candidato, a pessoa vê o que existe sobre ela — origem e data de cada registro, o que declarou sobre como prefere trabalhar, e quais empresas receberam seu perfil — antes mesmo de ver a pergunta de esclarecimento. Nenhuma análise de critério, nota de analista ou comparação aparece nessa visão.

## Decisões de design responsáveis

Mapeamento direto às restrições (`docs/enunciado/09-restricoes.md`) e exigências (`docs/enunciado/12-exigencias-tecnicas-normativas-regulatorias.md`):

| Exigência | Como o protótipo atende |
| --- | --- |
| LGPD — transparência e controle de acesso | Devolutiva ao candidato com origem e data de cada registro; persona "Visualizar como — demonstração" restringe o que cada papel vê (analista, gestor de uma empresa, candidato), sem misturar dados de outra empresa. |
| Proteção de dados sensíveis / vedação a dados de saúde | Os eixos de fit (`analysis/fit-axes.ts`) descrevem condições de trabalho observáveis — apoio, autonomia, comunicação, turno, aprendizado — nunca traços de personalidade ou saúde mental. Nenhum campo de diagnóstico, CID ou prontuário existe na base. |
| Redução de vieses | O traçado cultural da empresa exige respostas de gestão, RH e equipe; a equipe responde de forma anônima e agregada, com um **piso de 3 respostas** (`MIN_TEAM_RESPONSES` em `analysis/culture.ts`) antes de compor a leitura, e as respostas nunca são calculadas em média entre papéis diferentes — média entre quem gere a área e quem trabalha nela apagaria exatamente o viés que o critério pede para expor. |
| Supervisão humana / decisão não automatizada | Uma proposta de eixo cultural nunca vira resposta sozinha: fica marcada como pendente até alguém confirmar; um requisito obrigatório não atendido é sinalizado, não elimina a candidatura automaticamente; não existe botão "escolher automaticamente" ou "contratar o melhor" em nenhuma tela. |
| Uso responsável de IA / transparência de critérios | Toda resposta da análise assistida cita os registros usados (`AssistantResponse.citations`); o texto avisa que é "montado a partir dos registros selecionados nesta base de demonstração" e que "nenhuma informação foi inventada" (`analysis/fit-axes.ts`, `analysis/assistant.ts`). |
| Dados fictícios / sem acesso irrestrito | Toda a base (`fixtures/`) é sintética, com datas fixas e contatos em `example.com`; nenhum CPF ou dado clínico existe no domínio. |

## Roteiro de demonstração

O protótipo tem os dois roteiros embutidos na própria interface, acessíveis pela barra de demonstração ("Ver roteiro"):

**Curto (3 minutos), 7 passos** — mesmo caminho do roteiro completo, sem pular validação de estado:

1. Abrir a mesa de seleção de VAG-01 (90 candidaturas).
2. Filtrar por "Requisito obrigatório sem informação" — a triagem que substitui abrir perfil por perfil.
3. Selecionar Ana e Bruno e abrir a comparação.
4. Clicar numa conclusão e mostrar a evidência com a fonte.
5. Esclarecer o apoio inicial com o gestor e incorporar a resposta.
6. Abrir Ana na vaga 2 (`VAG-02`): mesmo perfil, contexto da empresa diferente, leitura diferente.
7. Registrar o encaminhamento e ver a trajetória dela entre os dois processos.

**Completo, 7 passos:**

1. Visão geral (`/iel`) → vaga Assistente de Logística.
2. Mesa de seleção de VAG-01 → abrir Ana Ribeiro e clicar numa conclusão para ver a evidência.
3. Selecionar Ana e Bruno na matriz e abrir a comparação (`/iel/vagas/VAG-01/comparar`).
4. Criar a pergunta ao gestor sobre apoio inicial, abrir a experiência do destinatário em Pendências e incorporar a resposta.
5. Abrir a vaga 2 (`VAG-02`) e ver Ana com contexto organizacional diferente; esclarecer a disponibilidade pendente.
6. Adicionar Ana à lista da vaga 2 e registrar em preparação do encaminhamento.
7. Trocar a persona para "Gestor — Horizonte Alimentos", registrar "Quero entrevistar" e voltar como analista para ver o histórico.

## Base de dados fictícia

Dois níveis, deliberadamente separados:

- **Núcleo curado** — 3 empresas, 3 vagas, 8 talentos, 10 candidaturas. É por onde o roteiro de demonstração passa; cada registro foi escrito à mão para sustentar um ponto específico (a divergência de apoio inicial na Cerrado Distribuição, a reutilização de uma experiência entre duas vagas, etc.).
- **Volume gerado** — 15 empresas, 39 vagas, 268 talentos, 635 candidaturas (`fixtures/generated.ts`), das quais 90 caem sobre a vaga do roteiro (`VAG-01`). Determinístico: semente fixa (`SEED = 20260914`), gerador `mulberry32` sem `Math.random()` nem `Date.now()`, datas derivadas da data de referência da base. IDs gerados levam o prefixo `GEN-`, então nunca colidem com o núcleo curado nem o alteram.

**Por que os dois níveis.** Com 8 talentos e 4 candidaturas numa vaga, o analista não precisa de ferramenta nenhuma — lê os quatro currículos. O enunciado cobra explicitamente escala ("ampliar o volume de talentos e oportunidades que podem ser avaliados", "evitando dependência de processos individualizados"). O volume gerado é o que torna a triagem por lacuna e a paginação da matriz necessárias em vez de decorativas; o núcleo curado é o que garante que a demonstração seja sempre a mesma história, roteirizável e reprodutível.

## Integração de IA

Hoje, a análise assistida é **determinística e curada**: monta texto a partir dos registros efetivamente selecionados na tela (nunca do estado inteiro da demonstração), sem consultar nenhum modelo de linguagem. O disclaimer aparece em toda resposta: "nenhum modelo de linguagem foi consultado e nenhuma informação foi inventada" (`analysis/fit-axes.ts`, `analysis/assistant.ts`). Isso cumpre a exigência do briefing de **não exigir chave de API** para a experiência principal — qualquer pessoa roda a demo sem configurar nada.

Uma camada de provider está em preparação em `app/apps/dashboard/features/iel-demo/ai/`, hoje com dois arquivos:

- `types.ts` — contrato Zod entre a UI e qualquer provider (`AssistantRequest`/`AssistantResponse`), incluindo o schema de saída esperado de um modelo real (`modelAssistantOutputSchema`, restrito a texto e citações — sem nota, sem ranking) e o enum de providers (`deterministic`, `anthropic`).
- `provider.ts` — a interface `AssistantProvider` (`run(request) → Promise<AssistantResponse>`) que qualquer implementação, determinística ou real, precisa cumprir.

Ainda não há adapter para um modelo real nem rota de API que o exponha (`/api/iel/assistant` existe como constante em `@workspace/routes`, mas o *route handler* correspondente não foi implementado). A intenção documentada no contrato é que trocar de provider — por trás de variáveis de ambiente como `IEL_AI_PROVIDER` e `ANTHROPIC_API_KEY` — nunca exija mudar a UI, porque ela só conhece `run(request)`. Isso ainda não está implementado; o que existe hoje é o contrato que torna essa troca possível depois.

## Arquitetura técnica

- **Monorepo** Bun + Turborepo, com o protótipo inteiro dentro de `apps/dashboard` (nenhum app ou pacote novo foi criado para o IEL).
- **Next.js 15** (App Router), rota isolada em `app/(iel)/iel`, com layout próprio que não usa autenticação nem toca as rotas protegidas do produto.
- **Estado client-side**: reducer (`state/reducer.ts`, 845 linhas) + `localStorage`, com persistência por delta — só o que diverge da base inicial é gravado — e throttle de 400ms na escrita, já que o campo de busca dispara a cada tecla e a base gerada tem ~2,2 MB (`state/storage.ts`).
- **Fixtures tipadas** (`features/iel-demo/fixtures/`, `types.ts`) descrevem todo o domínio: empresas, vagas, talentos, candidaturas, evidências, fontes de dados, eixos de fit.
- **Seletores puros** (`state/selectors.ts`, 1117 linhas) — a única forma como as telas leem dados; nenhuma tela acessa as fixtures diretamente.
- **Tailwind 4** com tokens de tema escopados em `[data-iel-theme]` (`app/(iel)/iel/iel-theme.css`), para não vazar paleta institucional (azul + ocre) no resto do produto autenticado, que usa a paleta padrão do Arki.

Estrutura de pastas do protótipo:

```
app/apps/dashboard/
├── app/(iel)/iel/              # rotas: layout, 11 telas, tema escopado
├── components/iel-demo/        # componentes de UI por área (jobs, selection,
│                                #   talents, companies, clarifications,
│                                #   referrals, manager, sources, overview, layout)
└── features/iel-demo/
    ├── types.ts                 # domínio inteiro do protótipo
    ├── format.ts
    ├── fixtures/                 # base curada + gerador determinístico
    ├── state/                    # reducer, seletores, persistência, provider React
    ├── analysis/                 # estados de critério, eixos de fit, cultura, assistente
    └── ai/                       # contrato de provider (em preparação)
```

## Como rodar

Sem Postgres: o protótipo é inteiramente client-side (estado em `localStorage`, sem chamada a banco ou API externa), então a rota `/iel` funciona com o dashboard subindo sem nenhum banco configurado.

```bash
bun install
bun run quickstart        # copia .env.example → .env, gera AUTH_SECRET, valida ambiente
bun --filter @workspace/dashboard dev
```

Abrir [http://localhost:3000/iel](http://localhost:3000/iel).

Comandos adicionais úteis durante o desenvolvimento (rodados na raiz do repo, salvo indicação contrária):

| Comando | O que faz |
| --- | --- |
| `bun run typecheck` | Typecheck do monorepo inteiro |
| `bun run lint` | Lint do monorepo |
| `bun run format` | Verifica formatação (Prettier) |
| `bun --filter @workspace/dashboard dev` | Sobe só o dashboard, onde o protótipo vive |
| `bun --filter @workspace/dashboard test` | Suíte de testes unitários do dashboard (inclui o IEL) |
| `bun --filter @workspace/dashboard test:e2e` | Suíte Playwright do dashboard |

Nenhum desses comandos usa `bun --cwd`, sintaxe removida no Bun 1.4; o padrão do repo é `bun --filter <workspace> <script>`.

## Testes

**Unitários** (Vitest). Rodando `bun --filter @workspace/dashboard test` no momento da escrita deste README, a suíte completa do dashboard (que inclui os testes do protótipo IEL e os do restante do starter kit) passa com:

```
Test Files  18 passed (18)
     Tests  134 passed (134)
```

Os testes específicos do IEL estão em `features/iel-demo/state/selectors.test.ts` (23 testes), `features/iel-demo/analysis/assistant.test.ts` (8 testes) e `features/iel-demo/state/demo-journey.test.ts` (34 testes) — este último cobre o contrato de que o núcleo curado sobrevive ao volume gerado, IDs não colidem, e a base é construída de forma idêntica em duas chamadas.

**E2E** (Playwright), dentro de `app/apps/dashboard`:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 bunx playwright test e2e/iel-demo --project=chromium
```

`e2e/iel-demo/iel-demo-journey.spec.ts` cobre cinco jornadas: a jornada completa do roteiro de demonstração, o limite de três candidatos na comparação com preservação da seleção, filtros de vaga afetando linhas e contadores, recebimento repetido de evento sem duplicar registros, e o fluxo de esclarecimento em largura de celular com navegação por teclado. Um teste de teclado é conhecido por falhar sob WebKit (confirmado como pré-existente à mudança que o expôs); o CI roda apenas Chromium.

## Fora do MVP e por quê

- **Acompanhamento pós-contratação** — o briefing exclui explicitamente essa etapa do escopo; a trajetória da pessoa entre processos para no resultado do encaminhamento (interesse em entrevista, empresa não avançou), nunca além disso.
- **Conectores reais** (Empregare, Gupy, avaliação externa) — o hackathon não exige integração técnica real; as quatro fontes são simuladas, com identificadores coerentes e sem credenciais inventadas.
- **Chatbot aberto para o candidato** — o briefing rejeita explicitamente "chat IA" como seção dominante ou tela inicial; a análise assistida é uma área contextual dentro da vaga, nunca uma conversa livre.
- **Testes psicológicos próprios** — o produto não aplica nenhuma avaliação nova; lê o que a empresa e a pessoa já declararam, nos mesmos eixos.

## Referência de mercado

A categoria de ferramentas de fit cultural — avaliação de aderência por instrumento psicométrico, aplicada em plataforma separada e com pontuação de compatibilidade — é o cenário que o próprio enunciado descreve como caro, lento e pouco escalável (`docs/enunciado/07-ja-sabemos-que.md`). Este protótipo se posiciona como alternativa a esse modelo: em vez de aplicar um novo instrumento a cada processo, lê o que os dois lados já registraram, nos mesmos eixos, dentro da mesma jornada. Nenhum fornecedor específico dessa categoria é citado ou usado como referência de dado real neste projeto.

## Limitações honestas

- A análise assistida é hoje texto montado por regras determinísticas sobre a base fictícia, não um modelo de linguagem real; a camada de provider para um modelo real existe apenas como contrato (`features/iel-demo/ai/`), sem adapter implementado.
- Não há rota de API (`/api/iel/assistant`) implementada — apenas a constante de rota reservada em `@workspace/routes`.
- O seletor de persona ("Visualizar como — demonstração") separa dados por papel dentro do protótipo, mas não é autenticação nem controle de acesso de produção; o próprio produto o rotula assim.
- A base é inteiramente sintética; nenhuma cobertura real de campo, esquema de banco do IEL ou fornecedor de avaliação externa foi usado — o enunciado veda isso explicitamente durante o hackathon.
- Persistência é local ao navegador (`localStorage`); não há armazenamento compartilhado entre sessões ou dispositivos.

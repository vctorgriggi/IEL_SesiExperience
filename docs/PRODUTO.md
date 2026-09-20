# Central de Seleção IEL — definição de produto

Documento de referência do protótipo. Sucede `BRIEFING_CLAUDE_PROTOTIPO_IEL.md`, que foi escrito antes da reunião com o IEL de 19/09/2026 e ficou desatualizado em pontos que o cliente decidiu. Onde este documento e o briefing divergirem, vale este; onde este e os documentos em `docs/cliente/` divergirem, valem os do cliente.

Data: 19/09/2026. Apresentação: 20/09/2026.

## Sumário

1. [Fontes e precedência](#1-fontes-e-precedência)
2. [O que o produto é](#2-o-que-o-produto-é)
3. [Princípios que não se negociam](#3-princípios-que-não-se-negociam)
4. [Regras de negócio do cliente](#4-regras-de-negócio-do-cliente)
5. [Privacidade por padrão](#5-privacidade-por-padrão)
6. [O que a reunião revoga no briefing](#6-o-que-a-reunião-revoga-no-briefing)
7. [Estado do protótipo frente aos Must](#7-estado-do-protótipo-frente-aos-must)
8. [Onde o protótipo hoje contraria o cliente](#8-onde-o-protótipo-hoje-contraria-o-cliente)
9. [Plano de alinhamento](#9-plano-de-alinhamento)
10. [O que fica fora, e por quê](#10-o-que-fica-fora-e-por-quê)
11. [Limites do que medimos](#11-limites-do-que-medimos)

## 1. Fontes e precedência

| Ordem | Fonte                                                     | O que decide                                                         |
| ----- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| 1     | `docs/cliente/03-transcricao-reuniao-2026-09-19.md`       | O que o IEL disse, com timestamp. Regras de negócio.                 |
| 2     | `docs/cliente/01-prioridade-funcionalidades-moscow.md`    | O que entra no MVP, em que ordem, e o critério de sucesso.           |
| 3     | `docs/cliente/02-entendimento-do-desafio-fit-cultural.md` | Síntese da equipe sobre dor, públicos e fluxo.                       |
| 4     | `docs/enunciado/`                                         | O edital: restrições, exigências normativas, critérios de resolução. |
| 5     | Este documento                                            | Decisões de produto derivadas das fontes acima.                      |
| 6     | `docs/BRIEFING_CLAUDE_PROTOTIPO_IEL.md`                   | Direção anterior à reunião. Válido onde não contrariado.             |

Regra prática: **uma decisão de produto precisa citar uma fonte de 1 a 4.** Se não cita, é hipótese, e vai marcada como tal.

## 2. O que o produto é

Uma camada de inteligência do IEL ao lado do Empregare, que continua sendo a base de currículos e vagas. Três entregas fecham o ciclo:

1. **Perfil cultural da empresa**, formado pela média das respostas de uma amostra de colaboradores de níveis e áreas diferentes — não por uma pessoa do RH — e complementado pelo que o analista percebe nas ligações.
2. **Questionário de fit do candidato**, disparado quando ele se candidata à vaga daquela empresa, nas mesmas dimensões, no celular, sem login, sem o nome da empresa.
3. **Painel do analista por vaga**, com match técnico e aderência cultural lado a lado, corte de 35% aplicado, e a marcação dos até 5 currículos a enviar.

A cena do pitch é uma só: o analista abre uma vaga e enxerga o ranking com fit. Tudo o que não ajuda essa cena espera (MoSCoW, regra de corte).

O problema real, na conclusão da equipe: _decidir quais 5 currículos enviar sem nenhum dado sobre a cultura da empresa e sobre o comportamento do candidato, num volume de 2.500 vagas por mês em que toda solução de mercado cobra por candidato._

## 3. Princípios que não se negociam

Cada um tem fonte. Juntos, eles são o teste de qualquer funcionalidade nova.

**Custo marginal zero por candidato.** Nenhuma etapa do caminho crítico depende de serviço cobrado por uso. O fit a R$ 100/candidato foi o motivo de o IEL não usar o que existe; a Mindsight foi abandonada por custo (00:06:55, 00:25:44). Consequência direta: IA paga não entra no caminho crítico. Pode existir como camada opcional, atrás de configuração, com fallback determinístico — e é assim que está.

**Nenhuma etapa nova para a empresa sem o analista por perto.** "Se colocar mais uma etapa para a empresa, eles não vão fazer" (00:23:28). A empresa não acessa o Empregare e não terá área logada (Won't). O analista conduz e registra durante a ligação; o que a empresa faz sozinha é responder um link de 5 minutos.

**Celular, sem login, linguagem simples.** O candidato é operacional, com baixo letramento digital; o IEL monta o currículo por ele quando preciso (00:08:01). Qualquer tela que ele não conclua sozinho tira ponto do MVP. Entrevista por IA foi descartada para esse público (00:08:34).

**Privacidade por padrão.** A LGPD foi citada pelo IEL como o que pode barrar a solução (00:12:53). Detalhado na seção 5.

**A decisão é humana.** O edital exige supervisão humana e diz que recomendações apoiam, não substituem. Propostas da análise assistida ficam pendentes até confirmação; o 35% é corte para o analista decidir, não gatilho automático.

**Empregare fica.** Integração, não substituição (00:25:59). No MVP a entrada é por planilha que o IEL já exporta; API depois, quando o Empregare disser o que expõe.

## 4. Regras de negócio do cliente

Extraídas da transcrição. Cada uma vincula o MVP.

| #   | Regra                                                                                                                                                                      | Fonte              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| R1  | O fit cultural é sobre a cultura da empresa, não sobre a vaga. A vaga se conecta ao técnico e ao comportamental.                                                           | 00:31:38, 00:39:02 |
| R2  | O perfil da empresa é a **média** das respostas de uma amostra de colaboradores de níveis e áreas diferentes, com peso para a área da vaga e áreas conexas (cerca de 20%). | 00:41:19–00:43:44  |
| R3  | **Aderência mínima de 35%** para o candidato ser considerado compatível. Soma com técnico e comportamental; sozinho não garante encaminhamento.                            | 00:20:19, 00:32:14 |
| R4  | O candidato responde o fit **ao se candidatar à vaga** daquela empresa.                                                                                                    | 00:39:02           |
| R5  | **O nome da empresa não aparece** para o candidato antes da entrevista. Ele vê atividade, localidade e segmento.                                                           | 00:22:21, 00:38:43 |
| R6  | **Máximo de 5 currículos** por vaga. Sem banco de vagas.                                                                                                                   | 00:33:30           |
| R7  | Prazo de **3 dias** para a amostra responder; **1 a 2 dias** para o candidato; quem não responde sai do processo.                                                          | 00:44:15, 00:45:28 |
| R8  | A empresa envia **só nome e e-mail corporativo** dos colaboradores; o consentimento é dado no aceite do questionário.                                                      | 00:42:48           |
| R9  | Vaga tem 30 dias; primeira triagem em até 15. Sem devolutiva, o analista cobra e envia nova remessa de 5.                                                                  | 00:36:39           |
| R10 | O filtro técnico do Empregare configurado errado expurga candidato aderente; é ponto de melhoria.                                                                          | 00:33:04           |

## 5. Privacidade por padrão

Não é uma seção de conformidade; é desenho. A regra: **todo dado nasce no menor escopo possível e só amplia por ação explícita e registrada.** O edital exige LGPD com finalidade, necessidade, segurança, transparência e controle de acesso.

### 5.1 O que cada um vê — matriz de acesso

| Dado                                           | Analista IEL                   | Empresa / gestor                               | Colaborador respondente | Candidato                                |
| ---------------------------------------------- | ------------------------------ | ---------------------------------------------- | ----------------------- | ---------------------------------------- |
| Nome da empresa                                | sim                            | a própria                                      | a própria               | **nunca antes da entrevista** (R5)       |
| Perfil cultural da empresa (média por eixo)    | sim                            | a própria                                      | não                     | não                                      |
| Respostas individuais dos colaboradores        | **não** — só agregado por eixo | não                                            | só a própria            | não                                      |
| Dispersão gestão × equipe                      | sim                            | a própria                                      | não                     | não                                      |
| Currículo e match técnico                      | sim                            | só dos até 5 enviados                          | não                     | o próprio                                |
| Respostas do candidato ao fit                  | sim                            | **não** — só a aderência por eixo dos enviados | não                     | as próprias                              |
| Aderência (% por eixo e total)                 | sim                            | dos até 5 enviados                             | não                     | a própria, por eixo, sem nome da empresa |
| Outros candidatos                              | sim                            | não                                            | não                     | não                                      |
| Anotações internas do analista                 | sim                            | **nunca**                                      | não                     | só a contagem de que existem             |
| Devolutiva da empresa (contratei / não / saiu) | sim                            | a própria                                      | não                     | não                                      |
| Check-in do contratado (continua? como está?)  | sim                            | **nunca**                                      | não                     | os próprios                              |

### 5.2 Minimização

- **Colaborador**: nome e e-mail corporativo, nada mais (R8). Sem telefone, sem cargo além da área, sem nível hierárquico identificável. As respostas são gravadas **agregadas por eixo e por papel** (gestão / equipe); a resposta individual não fica associada à pessoa após o envio. E um grupo que respondeu por link nunca aparece sozinho abaixo de 2 respostas (equipe: 3): "gestão da área: concordo (1)" seria a resposta de uma pessoa com outro nome. Abaixo do piso ela entra na média e na leitura de liderança (gestão e RH juntos), não na do grupo. A declaração da empresa, feita pela tela dela, não é anônima e aparece com uma resposta só.
- **Candidato**: o questionário só pergunta preferências de trabalho em situações do cotidiano. Nenhuma pergunta de personalidade, saúde, família, religião, opinião política ou qualquer categoria sensível. O edital veda dado de saúde na seleção e manda tratar bem-estar pela perspectiva do ambiente e das relações de trabalho.
- **Vaga e empresa**: o que o IEL já recebe pelo formulário do Empregare. Nada novo é pedido à empresa.

### 5.3 Consentimento (M7)

- Aceite no início de cada questionário, com texto curto dizendo **o que** é coletado, **para quê**, **quem vê**, **por quanto tempo** e **em que mais** a resposta será usada (§5.6). Sem aceite, o questionário não abre.
- Registro do aceite com data e hora **e com a versão do texto**, junto da resposta. Sem versão não há como demonstrar a que a pessoa consentiu, e é a versão que decide se aquela resposta pode ser reaproveitada em outra candidatura.
- O aceite diz, em palavra comum, como a pessoa desfaz: responder de novo (vale a última) ou pedir para sair.
- O candidato pode ver o que está registrado sobre ele e para quem foi enviado — sem nome de empresa, só atividade/localidade/segmento — e pedir correção pelo mesmo canal.

### 5.4 Links sem login

Um link sem login é uma credencial portadora. Por isso:

- **Curta validade**: 3 dias para colaborador, 2 para candidato (R7). Expirou, não abre.
- **Uso único** por respondente. Reaberto depois de enviado, mostra apenas "resposta registrada".
- **Sem dado pessoal na URL**: o token é opaco; nome, e-mail e vaga ficam no servidor.
- **Escopo mínimo**: o link do candidato abre só o questionário daquela candidatura; o do colaborador, só o da sua empresa.
- **Limite conhecido da demonstração**: a API da demo (`/api/iel/estado`, `/api/iel/acoes`) não autentica — a senha da equipe (`IEL_SENHA_ANALISTA`) protege as telas da analista, não a API; em produção, sessão por pessoa.

### 5.5 Visibilidade por padrão

- Todo registro sobre uma pessoa nasce **interno ao IEL**. Só passa a compartilhável por marcação explícita do analista, e o encaminhamento carrega um **snapshot** do que foi compartilhado naquele momento. Nada compartilhado depois aparece retroativamente para a empresa.
- Anotação interna do analista nunca sai do IEL, em nenhuma tela, em nenhum relatório.

### 5.6 Retenção e validade

- Perfil cultural da empresa tem validade (C4 — prazo a confirmar com o Coringa). Vencido, a tela avisa e o fit deixa de ser calculado sobre ele.
- **A resposta do candidato é dele e vale 12 meses** (`VALIDADE_DA_RESPOSTA_MESES`, em `analysis/candidate-questionnaire.ts`). O que a pessoa responde é como ela prefere trabalhar, e isso é dela, não da vaga: "o que eu gosto ou não é o candidato" (00:19:47). O que muda de empresa para empresa é o outro lado — o perfil dela e quais frases ela escolheu.
  - **Dentro dos 12 meses**, a resposta vale para as outras candidaturas da mesma pessoa dentro do IEL. O questionário de uma candidatura nova pergunta só a diferença: as frases que aquela empresa escolheu menos as que a pessoa já respondeu. Não sobrando nenhuma, não há formulário — a tela diz que as respostas dela ainda valem e ela confirma o uso, que fica registrado.
  - **Passados os 12 meses**, a resposta é como se não existisse: a frase volta a ser perguntada, e a aderência fica sem base naquele tema em vez de ser calculada sobre dado velho. Vale inclusive para a candidatura em que a resposta foi dada.
  - **Vale a última.** Duas respostas da mesma pessoa à mesma frase, a mais recente ganha — é assim que ela desfaz: responde de novo. Pedindo para sair, as respostas deixam de ser usadas em qualquer vaga.
  - **Reuso só com aceite que o preveja.** Guardar por 12 meses e reaproveitar amplia finalidade e retenção sobre dado já coletado, e por isso está escrito no aceite **antes** (versão `2026-09-22`). Quem aceitou uma versão anterior aceitou o oposto — aquele texto dizia que as respostas ficavam ligadas àquela candidatura: a resposta dada sob texto antigo continua valendo só para a candidatura em que foi dada e **nunca** é levada para outra. A frase volta a ser perguntada, sob o texto novo. Nada retroage (LGPD, art. 8º, § 4º).
  - A versão do aceite fica gravada junto da resposta (`consent.version`): é ela que permite demonstrar depois a que a pessoa consentiu (art. 6º, X).
- Dados de devolutiva (C3) são agregados por empresa para indicador; não identificam o candidato fora do IEL.
- **Onde o estado da demonstração mora.** Por padrão, no navegador de cada aparelho (`localStorage`), e nada sai da máquina. Com `IEL_ESTADO_COMPARTILHADO=1` e `DATABASE_URL` (Neon/Postgres), o estado passa a morar numa sala única no servidor (`iel_demo_salas`, só o delta sobre a base) com um log das ações (`iel_demo_eventos`, sem poda), para que a resposta dada no celular apareça no notebook da analista. É **base fictícia**: nenhuma pessoa real está gravada, e por isso não há retenção definida — em produção, o dado de pessoa teria tabela própria, prazo e sessão por pessoa.
- **O check-in do contratado é da pessoa e vale até 12 meses depois da contratação** (`analysis/acompanhamento.ts`). Aos 30, 60 e 90 dias o IEL pergunta à própria pessoa, por link, se ela continua na empresa e como está sendo. É finalidade nova sobre alguém que já foi contratado, por isso tem aceite próprio (versão `2026-09-22`), gravado em cada resposta. Coleta só as duas respostas e um comentário opcional — nada de saúde, família ou avaliação de chefe. A empresa **nunca** vê o que a pessoa respondeu: é a única forma de ela responder com verdade sobre o próprio emprego. A pessoa pode parar de receber as perguntas e pedir para apagar o que respondeu. Cada marco fica aberto por 30 dias; passado isso, não é mais cobrado. Quando a pessoa diz que saiu e a empresa não informou, as duas versões ficam registradas com a fonte, e o indicador de permanência assume a saída.

### 5.7 Redução de viés — como desenho de dado

- Perfil da empresa por **média de amostra**, nunca por uma pessoa (R2). Abaixo do mínimo de respondentes, o perfil não fecha e a tela diz isso.
- **Dispersão visível**: quando gestão e equipe respondem diferente num eixo, a diferença aparece ao lado da média — a média é o perfil, a dispersão é o diagnóstico. Não se escolhe uma versão em silêncio.
- A aderência é **explicável até o eixo**: o analista vê por que deu 41% e não 72%. Sem caixa-preta.
- O corte de 35% é **do cliente e configurável**, não descoberto por modelo. Devolutivas futuras (C3) o calibram; nunca o substituem sem decisão humana.

### 5.8 IA de terceiros

- **Provedor**: DeepSeek (API `api.deepseek.com`, modelo `deepseek-flash` por padrão). Anthropic fica como alternativa, com a mesma regra. Só liga com `IEL_AI_PROVIDER` e a chave do provedor; sem elas, tudo roda na regra fixa, sem IA paga.
- **A IA não decide**: aderência, ranking e corte são calculados pela regra fixa antes (R7). O modelo só conta em palavras o que já foi calculado, responde à pergunta livre da analista no Mind e sugere perguntas de entrevista. Não produz nota, não ordena pessoas e não recomenda contratar. A decisão continua da analista e da empresa.
- **O que sai**: a pergunta da analista, o título e os requisitos da vaga, o % de combina e de requisitos, os temas em que cada pessoa combina ou difere, o estado dos critérios e o texto dos registros citados. Tudo **pseudonimizado** no servidor (`features/iel-demo/ai/pseudonimizar.ts`).
- **O que não sai**: nome de pessoa (vira "Pessoa A", "Pessoa B"), nome da empresa (vira "a empresa") e do contato dela, e-mail, telefone, CPF, datas (nascimento incluso), cidade e os ids da base, que carregam nomes. O mapa de volta fica só na memória do servidor, durante a requisição; os nomes voltam mascarados ("Helena C.") antes de chegar à tela. Pedido de contato no Mind é recusado no navegador, sem chamar a API.
- **Transferência internacional (LGPD, art. 33)**: o provedor processa fora do Brasil. A pseudonimização reduz o risco, mas o dado pseudonimizado continua pessoal para o IEL, que tem o mapa (art. 13, § 4º). **A base legal e o instrumento de transferência (cláusulas-padrão, art. 33, II) estão a confirmar com o jurídico do IEL** antes de ligar a chave com dado real. Na demonstração, a base é fictícia.
- **Contenção**: a rota do Mind aceita 20 pedidos por minuto por IP; timeout de 20 s; qualquer falha do modelo cai para a regra fixa com aviso na resposta.

## 6. O que a reunião revoga no briefing

Decisões que o protótipo tomou seguindo o briefing e que o cliente contrariou. Registradas porque foram escolhas deliberadas, não descuido — e porque a razão de revertê-las precisa ficar explícita.

| Briefing dizia                                                                                                     | O cliente disse                                                                                             | Decisão                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Evite uma nota global de fit no MVP."                                                                             | "O fit tem que ter no mínimo 35% de aderência para ser compatível." (00:20:19)                              | **Revogado.** Existe percentual por eixo e total, com corte de 35%. O rótulo é sempre "aderência", nunca "chance de sucesso"; o denominador fica visível.                                                                                 |
| "Não apresentar um ranking universal de melhores pessoas."                                                         | M5: "Ranking dos candidatos com match técnico e fit lado a lado."                                           | **Revogado no escopo da vaga.** O ranking é por vaga, sobre candidatos daquela empresa, ordenado por aderência à cultura daquela empresa. Não existe ranking entre vagas nem "melhores pessoas" em abstrato — isso continua fora.         |
| "Não obrigar todos os candidatos a repetir entrevista e cadastro." / "Não construir testes psicológicos próprios." | M3: questionário de 5 minutos, pares de situação, no celular, na candidatura.                               | **Reinterpretado.** O que o briefing vedava era instrumento psicométrico e entrevista. Um questionário curto de preferências de trabalho, aplicado uma vez por candidatura, é o que o IEL já fazia e pediu. Não é teste de personalidade. |
| Perfil da empresa por respondentes múltiplos **sem média** ("média entre quem manda e quem executa apaga o viés"). | "O fit cultural é a média do que a empresa entende." (00:41:44)                                             | **Ajustado.** A média é o perfil, como o cliente opera. A dispersão continua calculada e mostrada ao lado — ela não some, deixa de ser o único resultado.                                                                                 |
| Persona "gestor da empresa" com painel próprio.                                                                    | Won't: "Login e área logada para a empresa. Mais uma etapa para ela foi apontada como risco de não adesão." | **Reduzido.** A empresa não tem painel. O que ela recebe: o link do questionário para os colaboradores, os até 5 currículos com aderência, e uma devolutiva de um clique (C3, fase 2).                                                    |
| Candidato vê "para quem seu perfil foi enviado", com nome da empresa.                                              | R5: nome da empresa oculto até a entrevista.                                                                | **Corrigir.** A devolutiva ao candidato mostra atividade, localidade e segmento; nunca o nome.                                                                                                                                            |

O que o briefing dizia e **continua valendo**: transparência das fontes de cada conclusão; estados de critério nunca só por cor; proposta da análise assistida com confirmação humana; ambiente de demonstração explícito; dados fictícios com identificadores estáveis; nada de acompanhamento pós-contratação no MVP.

## 7. Estado do protótipo frente aos Must

Reavaliado em 19/09, com o instrumento de 52 frases no lugar e o ciclo inteiro navegável. A coluna "falta" agora é curta de propósito: o que sobrou nela é o que depende de banco, de envio real ou de vaga rodando.

| Must                                   | O que pede                                                                       | O que existe hoje                                                                                                                                                                                                                    | Falta                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| **M1** Perfil cultural da empresa      | Questionário curto, amostra de colaboradores, perfil = média                     | Instrumento de 52 frases em 10 temas; empresa responde por tema; perfil é a média da amostra; piso de 3 respostas de equipe bloqueia o tema; dispersão gestão × equipe visível; cultura percebida pelo analista ao lado da declarada | Validade do perfil no tempo (C4, prazo a confirmar com o Coringa)             |
| **M2** Link por colaborador + contador | Analista cadastra nome + e-mail, sistema gera links, mostra N de M, prazo 3 dias | Convites por empresa com link próprio, progresso N de M, prazo, estado por convite e reenvio; bloco de 16 frases por convite, sorteado em matriz                                                                                     | Envio real por e-mail/WhatsApp e token de uso único com expiração no servidor |
| **M3** Questionário do candidato       | Mesmas dimensões, celular, sem login, na candidatura, sem nome da empresa        | Questionário por candidatura, uma frase por tela, no celular, sem login, com aceite; versão em conversa guiada; vaga sem nome de empresa (R5)                                                                                        | Entrega do link por SMS/e-mail                                                |
| **M4** Motor de aderência              | % por dimensão e total, corte 35%                                                | Aderência por tema e total, corte de 35% que marca sem eliminar, ausência que não vira zero, plano B por pares quando a frase da empresa não fechou                                                                                  | Calibração contra desfecho real (ver §11.3)                                   |
| **M5** Painel por vaga                 | Ranking técnico + fit lado a lado, leitura por dimensão, marcar até 5            | Mesa de seleção com técnico e aderência lado a lado, ordenação, corte visível, resgate de quem o filtro expurgou, comparação, limite de 5 na remessa                                                                                 | —                                                                             |
| **M6** Importação de planilha          | Upload da vaga e dos candidatos com match técnico                                | Importação da planilha exportada do Empregare, com mapeamento e idempotência; tela de fontes de dados declarando o que é simulado                                                                                                    | API do Empregare (C1), quando eles disserem o que expõem                      |
| **M7** Consentimento                   | Aceite no início de cada questionário; dados mínimos                             | Aceite que nasce desmarcado nos dois questionários, com versão gravada junto da resposta; frases restritas a condição de trabalho; equipe anônima e agregada; nota interna nunca sai                                                 | Fluxo de direitos do titular (acesso, correção, oposição) com registro        |

Além dos Must, e bem recebido pelo cliente: cultura declarada × percebida (S1), procedência de cada registro, resgate de quem o filtro automático descartaria (S2), relatório de aderência para a empresa (S3), assistente conversacional para o público operacional (C2) e a camada de IA opcional, que fica desligada por padrão e nunca decide.

## 8. Onde o protótipo hoje contraria o cliente

Lista curta, sem atenuante. Os sete itens de 19/09 pela manhã foram resolvidos, menos um — e ele continua aqui porque decisão pendente não vira decisão tomada por silêncio.

1. **A empresa ainda tem painel.** Existe uma persona de gestor com visão própria dentro do app do analista. É um Won't: a empresa não acessa nem o Empregare, e mais uma etapa foi apontada como risco de não adesão (00:23:28). O que ela deve ter é só o que chega por link — o questionário dos colaboradores, os até 5 currículos com aderência e a devolutiva de um clique.

Resolvidos desde então, para registro: nome da empresa oculto em toda superfície do candidato (R5); aderência em percentual com corte de 35% (R3); ranking por vaga na mesa de seleção (M5); limite de 5 na remessa (R6); perfil da empresa como média da amostra (R2); questionário do candidato na candidatura (M3, R4).

## 9. Plano de alinhamento

Os nove passos de 19/09 pela manhã fecharam, menos o oitavo (encolher a persona da empresa). O que está em curso agora atende à segunda metade da crítica: o produto decidia bem quais 5 currículos enviar, e não devolvia nada nem ao cliente nem ao candidato.

| Frente                  | Entrega                                                                                                                                                                                                                        | Fecha                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Devolutiva de um clique | A empresa diz, no próprio relatório que abre por link, o que aconteceu com cada pessoa: contratei, não contratei, saiu antes de 90 dias. O dado capturado alimenta o indicador e o analista vê o que está pendente para cobrar | C3; o dado que o IEL nunca teve (00:05:33)      |
| Minha candidatura       | O candidato passa a ter onde ver em que pé está, o que acontece agora e o que está registrado sobre ele — sem nome de empresa, sem posição, sem login                                                                          | A assimetria de quem responde e não recebe nada |
| Custo da rotatividade   | O número que a analista fala ao telefone: quanto aquela empresa gasta reabrindo a mesma vaga, com as parcelas à vista e editáveis                                                                                              | S5; o argumento de adesão que o IEL pediu       |
| BI honesto              | Separar, na tela, o indicador que vem de devolutiva capturada do que vem de histórico simulado                                                                                                                                 | Não prometer dado que não existe                |

Critério de pronto de cada frente: `bun run typecheck` e `bun run lint` verdes, a tela percorrida no navegador sem erro de console, e a doc da tela atualizada no mesmo passo. Testes automatizados estão suspensos por decisão do time durante o hackathon.

## 10. O que fica fora, e por quê

| Fora                                                 | Motivo                                                                                                                                             | Fonte              |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Substituir o Empregare                               | O IEL quer integrar; migração esbarra na LGPD                                                                                                      | Won't; 00:25:59    |
| Entrevista por vídeo ou IA                           | Não atrai o público operacional                                                                                                                    | Won't; 00:08:34    |
| Testes psicológicos / perfil comportamental completo | Exige instrumento próprio e validação; o Empregare já tem um básico                                                                                | Won't              |
| Login e área logada para a empresa                   | Etapa a mais = risco de não adesão                                                                                                                 | Won't; 00:23:28    |
| Gestão do processo seletivo                          | A seleção é da empresa; o IEL faz atração e triagem                                                                                                | Won't; 00:04:30    |
| Acompanhar a pessoa dentro da empresa                | A gestão do time é da indústria. O que o IEL passa a saber é o desfecho, pela devolutiva de um clique — e, pelo check-in de 30/60/90 dias, se a pessoa continua e como está sendo. O check-in é do IEL com a pessoa, não uma janela para dentro da empresa: não pergunta de chefe, de equipe nem de desempenho | Briefing; MoSCoW   |
| IA no caminho crítico                                | Custo marginal zero                                                                                                                                | Princípio 1        |
| Chatbot aberto para o candidato                      | C2, fase 4; ideia aprovada, mas pede IA no caminho do candidato e teste com público real                                                           | MoSCoW             |
| Nomes de fornecedores no produto                     | O briefing proíbe inventar; o cliente citou a Mindsight como referência do que funcionou e do custo, não como parte da solução                     | Briefing; 00:25:12 |

## 11. Limites do que medimos

Esta seção existe para ser lida em voz alta quando alguém perguntar se isto é ciência. A resposta honesta é: **é um instrumento de triagem declarativo, não um teste psicológico**, e a diferença importa para o IEL, para a indústria e para o candidato.

### 11.1 O que o instrumento é

52 frases da planilha do cliente, em 10 temas, respondidas numa escala de concordância de 5 pontos pelos dois lados. A empresa responde por tema, com uma amostra de colaboradores (mínimo de 3 respostas de equipe para o tema fechar, até 10 convidados); o candidato lê, na versão curta, as frases que a empresa escolheu. A aderência é a proximidade entre as duas respostas, tema a tema, e o resultado é explicável até a frase.

### 11.2 O que ele não é, e o que nenhuma tela pode sugerir que seja

- **Não é psicometria.** Não há construto validado, não há norma populacional, não há confiabilidade medida. É preferência declarada sobre condição de trabalho.
- **Não mede desempenho** e não prevê quem será bom funcionário. O rótulo em tela é "combina com a empresa", nunca "chance de sucesso" (§6).
- **Não descreve a pessoa.** Os temas falam de ambiente de trabalho. "Autonomia" é uma frase sobre como o trabalho acontece, nunca sobre quem alguém é.
- **Não decide.** O corte de 35% marca para o olho humano; não elimina ninguém do processo, e a ausência de resposta nunca vira zero.

### 11.3 Os três limites que conhecemos, e o que fizemos com cada um

**Autorrelato e desejabilidade social.** Quem quer a vaga responde o que imagina que se espera dele. Mitigamos onde dá: 6 frases em que quase todo mundo concorda foram marcadas como não discriminantes e ficam **fora da conta de aderência**; 5 pares invertidos e 5 equivalentes permitem ler a mesma disposição por dois caminhos. O que continua verdadeiro: um questionário respondido por quem precisa do emprego não é uma medida limpa, e nenhuma engenharia resolve isso. Por isso a aderência soma com o técnico e com o comportamental, e sozinha não encaminha ninguém (R3).

**Semelhança não é qualidade.** Medir encaixe é medir parecença com a equipe atual, e parecença, levada ao limite, homogeneíza: uma empresa com cultura adoecida ficaria excelente em receber gente que tolera cultura adoecida. Os freios de desenho são três: a **cultura declarada frente à vivida** (o que a empresa diz de si, o que a amostra responde e o que o analista percebe na ligação) transforma o resultado em diagnóstico da empresa, não só em filtro de pessoa; a **dispersão entre gestão e equipe** fica visível ao lado da média, em vez de ser apagada por ela; e a aba de **resgate** existe justamente para devolver ao olho humano quem o filtro automático tirou da frente.

**A conta ainda não foi calibrada contra a realidade.** Os pesos por tema e o corte de 35% vieram do cliente, não de dado observado — o próprio IEL não sabe quem foi contratado nem quem ficou. É exatamente o que a devolutiva de um clique passa a coletar: com desfecho real acumulado, dá para verificar se quem ficou tinha, de fato, aderência maior, e corrigir a conta. Até lá, é hipótese declarada como hipótese.

### 11.4 O que fica fora por decisão, não por falta de tempo

Nenhuma pergunta de personalidade, saúde, família, religião, opinião política ou qualquer categoria sensível. Nenhum dado de idade, gênero ou origem entra na aderência. O edital veda dado de saúde na seleção e manda tratar bem-estar pela perspectiva do ambiente e das relações de trabalho; o instrumento inteiro foi escrito dentro dessa fronteira.

### 11.5 O que faria disto um instrumento validado

Volume de respostas, análise de itens (quais frases de fato separam pessoas), consistência interna por tema e correlação com permanência real. Nada disso cabe em 48 horas, e nenhuma dessas etapas é dispensável para chamar isto de medida. O que o produto já faz é **nascer coletando o dado que permitiria fazê-las** — e dizer, em cada tela, o tamanho da evidência que tem na mão.

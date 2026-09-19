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

## 1. Fontes e precedência

| Ordem | Fonte | O que decide |
| --- | --- | --- |
| 1 | `docs/cliente/03-transcricao-reuniao-2026-09-19.md` | O que o IEL disse, com timestamp. Regras de negócio. |
| 2 | `docs/cliente/01-prioridade-funcionalidades-moscow.md` | O que entra no MVP, em que ordem, e o critério de sucesso. |
| 3 | `docs/cliente/02-entendimento-do-desafio-fit-cultural.md` | Síntese da equipe sobre dor, públicos e fluxo. |
| 4 | `docs/enunciado/` | O edital: restrições, exigências normativas, critérios de resolução. |
| 5 | Este documento | Decisões de produto derivadas das fontes acima. |
| 6 | `docs/BRIEFING_CLAUDE_PROTOTIPO_IEL.md` | Direção anterior à reunião. Válido onde não contrariado. |

Regra prática: **uma decisão de produto precisa citar uma fonte de 1 a 4.** Se não cita, é hipótese, e vai marcada como tal.

## 2. O que o produto é

Uma camada de inteligência do IEL ao lado do Empregare, que continua sendo a base de currículos e vagas. Três entregas fecham o ciclo:

1. **Perfil cultural da empresa**, formado pela média das respostas de uma amostra de colaboradores de níveis e áreas diferentes — não por uma pessoa do RH — e complementado pelo que o analista percebe nas ligações.
2. **Questionário de fit do candidato**, disparado quando ele se candidata à vaga daquela empresa, nas mesmas dimensões, no celular, sem login, sem o nome da empresa.
3. **Painel do analista por vaga**, com match técnico e aderência cultural lado a lado, corte de 35% aplicado, e a marcação dos até 5 currículos a enviar.

A cena do pitch é uma só: o analista abre uma vaga e enxerga o ranking com fit. Tudo o que não ajuda essa cena espera (MoSCoW, regra de corte).

O problema real, na conclusão da equipe: *decidir quais 5 currículos enviar sem nenhum dado sobre a cultura da empresa e sobre o comportamento do candidato, num volume de 2.500 vagas por mês em que toda solução de mercado cobra por candidato.*

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

| # | Regra | Fonte |
| --- | --- | --- |
| R1 | O fit cultural é sobre a cultura da empresa, não sobre a vaga. A vaga se conecta ao técnico e ao comportamental. | 00:31:38, 00:39:02 |
| R2 | O perfil da empresa é a **média** das respostas de uma amostra de colaboradores de níveis e áreas diferentes, com peso para a área da vaga e áreas conexas (cerca de 20%). | 00:41:19–00:43:44 |
| R3 | **Aderência mínima de 35%** para o candidato ser considerado compatível. Soma com técnico e comportamental; sozinho não garante encaminhamento. | 00:20:19, 00:32:14 |
| R4 | O candidato responde o fit **ao se candidatar à vaga** daquela empresa. | 00:39:02 |
| R5 | **O nome da empresa não aparece** para o candidato antes da entrevista. Ele vê atividade, localidade e segmento. | 00:22:21, 00:38:43 |
| R6 | **Máximo de 5 currículos** por vaga. Sem banco de vagas. | 00:33:30 |
| R7 | Prazo de **3 dias** para a amostra responder; **1 a 2 dias** para o candidato; quem não responde sai do processo. | 00:44:15, 00:45:28 |
| R8 | A empresa envia **só nome e e-mail corporativo** dos colaboradores; o consentimento é dado no aceite do questionário. | 00:42:48 |
| R9 | Vaga tem 30 dias; primeira triagem em até 15. Sem devolutiva, o analista cobra e envia nova remessa de 5. | 00:36:39 |
| R10 | O filtro técnico do Empregare configurado errado expurga candidato aderente; é ponto de melhoria. | 00:33:04 |

## 5. Privacidade por padrão

Não é uma seção de conformidade; é desenho. A regra: **todo dado nasce no menor escopo possível e só amplia por ação explícita e registrada.** O edital exige LGPD com finalidade, necessidade, segurança, transparência e controle de acesso.

### 5.1 O que cada um vê — matriz de acesso

| Dado | Analista IEL | Empresa / gestor | Colaborador respondente | Candidato |
| --- | --- | --- | --- | --- |
| Nome da empresa | sim | a própria | a própria | **nunca antes da entrevista** (R5) |
| Perfil cultural da empresa (média por eixo) | sim | a própria | não | não |
| Respostas individuais dos colaboradores | **não** — só agregado por eixo | não | só a própria | não |
| Dispersão gestão × equipe | sim | a própria | não | não |
| Currículo e match técnico | sim | só dos até 5 enviados | não | o próprio |
| Respostas do candidato ao fit | sim | **não** — só a aderência por eixo dos enviados | não | as próprias |
| Aderência (% por eixo e total) | sim | dos até 5 enviados | não | a própria, por eixo, sem nome da empresa |
| Outros candidatos | sim | não | não | não |
| Anotações internas do analista | sim | **nunca** | não | só a contagem de que existem |
| Devolutiva da empresa (contratei / não / saiu) | sim | a própria | não | não |

### 5.2 Minimização

- **Colaborador**: nome e e-mail corporativo, nada mais (R8). Sem telefone, sem cargo além da área, sem nível hierárquico identificável. As respostas são gravadas **agregadas por eixo e por papel** (gestão / equipe); a resposta individual não fica associada à pessoa após o envio.
- **Candidato**: o questionário só pergunta preferências de trabalho em situações do cotidiano. Nenhuma pergunta de personalidade, saúde, família, religião, opinião política ou qualquer categoria sensível. O edital veda dado de saúde na seleção e manda tratar bem-estar pela perspectiva do ambiente e das relações de trabalho.
- **Vaga e empresa**: o que o IEL já recebe pelo formulário do Empregare. Nada novo é pedido à empresa.

### 5.3 Consentimento (M7)

- Aceite no início de cada questionário, com texto curto dizendo **o que** é coletado, **para quê**, **quem vê** e **por quanto tempo**. Sem aceite, o questionário não abre.
- Registro do aceite com data e hora, vinculado ao link, não à pessoa (o link já é a chave).
- O candidato pode ver o que está registrado sobre ele e para quem foi enviado — sem nome de empresa, só atividade/localidade/segmento — e pedir correção pelo mesmo canal.

### 5.4 Links sem login

Um link sem login é uma credencial portadora. Por isso:

- **Curta validade**: 3 dias para colaborador, 2 para candidato (R7). Expirou, não abre.
- **Uso único** por respondente. Reaberto depois de enviado, mostra apenas "resposta registrada".
- **Sem dado pessoal na URL**: o token é opaco; nome, e-mail e vaga ficam no servidor.
- **Escopo mínimo**: o link do candidato abre só o questionário daquela candidatura; o do colaborador, só o da sua empresa.

### 5.5 Visibilidade por padrão

- Todo registro sobre uma pessoa nasce **interno ao IEL**. Só passa a compartilhável por marcação explícita do analista, e o encaminhamento carrega um **snapshot** do que foi compartilhado naquele momento. Nada compartilhado depois aparece retroativamente para a empresa.
- Anotação interna do analista nunca sai do IEL, em nenhuma tela, em nenhum relatório.

### 5.6 Retenção e validade

- Perfil cultural da empresa tem validade (C4 — prazo a confirmar com o Coringa). Vencido, a tela avisa e o fit deixa de ser calculado sobre ele.
- Respostas de candidatos ficam vinculadas à candidatura; encerrada a vaga (30 dias, R9), deixam de ser reaproveitadas sem novo aceite.
- Dados de devolutiva (C3) são agregados por empresa para indicador; não identificam o candidato fora do IEL.

### 5.7 Redução de viés — como desenho de dado

- Perfil da empresa por **média de amostra**, nunca por uma pessoa (R2). Abaixo do mínimo de respondentes, o perfil não fecha e a tela diz isso.
- **Dispersão visível**: quando gestão e equipe respondem diferente num eixo, a diferença aparece ao lado da média — a média é o perfil, a dispersão é o diagnóstico. Não se escolhe uma versão em silêncio.
- A aderência é **explicável até o eixo**: o analista vê por que deu 41% e não 72%. Sem caixa-preta.
- O corte de 35% é **do cliente e configurável**, não descoberto por modelo. Devolutivas futuras (C3) o calibram; nunca o substituem sem decisão humana.

## 6. O que a reunião revoga no briefing

Decisões que o protótipo tomou seguindo o briefing e que o cliente contrariou. Registradas porque foram escolhas deliberadas, não descuido — e porque a razão de revertê-las precisa ficar explícita.

| Briefing dizia | O cliente disse | Decisão |
| --- | --- | --- |
| "Evite uma nota global de fit no MVP." | "O fit tem que ter no mínimo 35% de aderência para ser compatível." (00:20:19) | **Revogado.** Existe percentual por eixo e total, com corte de 35%. O rótulo é sempre "aderência", nunca "chance de sucesso"; o denominador fica visível. |
| "Não apresentar um ranking universal de melhores pessoas." | M5: "Ranking dos candidatos com match técnico e fit lado a lado." | **Revogado no escopo da vaga.** O ranking é por vaga, sobre candidatos daquela empresa, ordenado por aderência à cultura daquela empresa. Não existe ranking entre vagas nem "melhores pessoas" em abstrato — isso continua fora. |
| "Não obrigar todos os candidatos a repetir entrevista e cadastro." / "Não construir testes psicológicos próprios." | M3: questionário de 5 minutos, pares de situação, no celular, na candidatura. | **Reinterpretado.** O que o briefing vedava era instrumento psicométrico e entrevista. Um questionário curto de preferências de trabalho, aplicado uma vez por candidatura, é o que o IEL já fazia e pediu. Não é teste de personalidade. |
| Perfil da empresa por respondentes múltiplos **sem média** ("média entre quem manda e quem executa apaga o viés"). | "O fit cultural é a média do que a empresa entende." (00:41:44) | **Ajustado.** A média é o perfil, como o cliente opera. A dispersão continua calculada e mostrada ao lado — ela não some, deixa de ser o único resultado. |
| Persona "gestor da empresa" com painel próprio. | Won't: "Login e área logada para a empresa. Mais uma etapa para ela foi apontada como risco de não adesão." | **Reduzido.** A empresa não tem painel. O que ela recebe: o link do questionário para os colaboradores, os até 5 currículos com aderência, e uma devolutiva de um clique (C3, fase 2). |
| Candidato vê "para quem seu perfil foi enviado", com nome da empresa. | R5: nome da empresa oculto até a entrevista. | **Corrigir.** A devolutiva ao candidato mostra atividade, localidade e segmento; nunca o nome. |

O que o briefing dizia e **continua valendo**: transparência das fontes de cada conclusão; estados de critério nunca só por cor; proposta da análise assistida com confirmação humana; ambiente de demonstração explícito; dados fictícios com identificadores estáveis; nada de acompanhamento pós-contratação no MVP.

## 7. Estado do protótipo frente aos Must

Avaliação honesta em 19/09, após os commits em `feat/prototipo-central-selecao-iel`.

| Must | O que pede | O que existe | Falta |
| --- | --- | --- | --- |
| **M1** Perfil cultural da empresa | Questionário de pares de situação, amostra de colaboradores, perfil = média | Questionário parametrizável por eixo; respostas por papel (gestão/RH/equipe) com contagem; detecção de divergência; proposta assistida com confirmação | **Média por eixo como perfil**; modelo de amostra (quem foi convidado, quantos, de que áreas); piso de respostas como bloqueio do perfil, não só aviso |
| **M2** Link por colaborador + contador | Analista cadastra nome + e-mail, sistema gera links, mostra N de M, prazo 3 dias | Nada | **Tudo**: roster de convidados, geração de link, contador, prazo, estado por link (pendente / respondido / expirado) |
| **M3** Questionário do candidato | Mesmas dimensões, celular, sem login, na candidatura, sem nome da empresa | Canal de esclarecimento (uma pergunta, resposta livre); devolutiva ao candidato | **O questionário em si** (pares de situação nos 5 eixos), vinculado à candidatura; tela mobile-first; ocultar nome da empresa |
| **M4** Motor de aderência | % por dimensão e total, corte 35% | Leitura por eixo em estados (alinhamento / a esclarecer / divergência / sem informação); pesos por eixo | **O cálculo percentual** sobre as respostas dos dois lados; o corte; a marcação "compatível / abaixo do corte" |
| **M5** Painel por vaga | Ranking técnico + fit lado a lado, leitura por dimensão, marcar até 5 | Matriz por candidatura com estados por dimensão; triagem por lacuna; comparação 2–3; lista de encaminhamento; procedência | **Coluna de match técnico** (da planilha); **coluna de aderência %** e ordenação por ela; **limite de 5** na lista; leitura "combina / destoa" por eixo na própria matriz |
| **M6** Importação de planilha | Upload da vaga e dos candidatos com match técnico | "Fontes de dados" com sincronização simulada e idempotência | **Upload de CSV/XLSX** com o layout que o IEL exporta; mapeamento de colunas; match técnico entrando como dado |
| **M7** Consentimento | Aceite no início de cada questionário; dados mínimos | Eixos restritos a condições de trabalho; equipe anônima e agregada; notas internas nunca saem | **Tela de aceite** com registro; texto de finalidade; expiração de link |

O que o protótipo tem **além** dos Must e que agrada ao cliente: cultura declarada × percebida (S1, "bem recebida"), procedência de cada registro, trajetória entre processos, camada de IA opcional com custo zero por padrão.

## 8. Onde o protótipo hoje contraria o cliente

Lista curta, sem atenuante. São correções, não melhorias.

1. **O candidato vê o nome da empresa** na devolutiva ("Para quem seu perfil foi enviado: Horizonte Alimentos"). Viola R5.
2. **Não existe aderência em percentual nem corte de 35%.** Contraria R3 e M4; foi escolha deliberada contra o briefing, revogada na seção 6.
3. **Não existe ranking na mesa de seleção.** Contraria M5.
4. **A lista de encaminhamento não limita a 5.** Contraria R6.
5. **O perfil da empresa não é calculado como média.** Contraria R2; a dispersão existe, a média não.
6. **A empresa tem um painel** (persona gestor com visão geral, vagas, encaminhamentos). É um Won't. Deve encolher para a experiência de destinatário: responder link, receber currículos, devolutiva de um clique.
7. **Não existe questionário do candidato** — só o canal de esclarecimento. Contraria M3 e R4.

## 9. Plano de alinhamento

Na ordem do MoSCoW e da regra de corte: **M5, M4 e M3 inteiros; M1 e M2 com empresa exemplo já respondida; M6 com planilha de exemplo; M7 como tela simples de aceite.**

| Passo | Entrega | Fecha |
| --- | --- | --- |
| 1 | Ocultar nome da empresa em toda superfície do candidato | R5, item 8.1 |
| 2 | Motor de aderência: % por eixo e total a partir das respostas dos dois lados; corte 35% configurável; rótulo "aderência" | M4, R3 |
| 3 | Mesa de seleção: colunas match técnico e aderência, ordenação por aderência, marca de corte, limite de 5 na lista | M5, R6 |
| 4 | Questionário do candidato: 5 eixos em pares de situação, mobile-first, vinculado à candidatura, com aceite | M3, M7, R4 |
| 5 | Perfil da empresa como média por eixo; dispersão ao lado; piso de respondentes bloqueia o perfil | M1, R2 |
| 6 | Roster de colaboradores + links + contador N de M + prazo 3 dias, com uma empresa já respondida na demo | M2, R7, R8 |
| 7 | Importação de planilha de exemplo (vaga + candidatos + match técnico) | M6 |
| 8 | Encolher a persona da empresa para destinatário: sem painel | Won't |
| 9 | Should na ordem S1 → S5, se sobrar tempo | — |

Critério de pronto de cada passo: typecheck, lint, testes e as 5 jornadas Playwright verdes; nenhum texto ou nome acessível que o e2e use é alterado sem atualizar o e2e no mesmo commit.

## 10. O que fica fora, e por quê

| Fora | Motivo | Fonte |
| --- | --- | --- |
| Substituir o Empregare | O IEL quer integrar; migração esbarra na LGPD | Won't; 00:25:59 |
| Entrevista por vídeo ou IA | Não atrai o público operacional | Won't; 00:08:34 |
| Testes psicológicos / perfil comportamental completo | Exige instrumento próprio e validação; o Empregare já tem um básico | Won't |
| Login e área logada para a empresa | Etapa a mais = risco de não adesão | Won't; 00:23:28 |
| Gestão do processo seletivo | A seleção é da empresa; o IEL faz atração e triagem | Won't; 00:04:30 |
| Acompanhamento pós-contratação | Fora do MVP no briefing; devolutiva de um clique é C3 (fase 2) | Briefing; MoSCoW |
| IA no caminho crítico | Custo marginal zero | Princípio 1 |
| Chatbot aberto para o candidato | C2, fase 4; ideia aprovada, mas pede IA no caminho do candidato e teste com público real | MoSCoW |
| Nomes de fornecedores no produto | O briefing proíbe inventar; o cliente citou a Mindsight como referência do que funcionou e do custo, não como parte da solução | Briefing; 00:25:12 |

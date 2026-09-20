# Base de demonstração — empresas reais de Cuiabá

**Data da pesquisa:** 19/09/2026. **Código:** `app/apps/dashboard/features/iel-demo/fixtures/empresas-reais.ts` (empresas, equipes, vagas, amostra e respostas), `candidatos-reais.ts` (pessoas fictícias e candidaturas), `outcomes.ts` (histórico de remessas e reaberturas).

O dono do produto pediu uma base "mais realista", com a Colatte e outras empresas de Cuiabá, e "um candidato especial" para a demonstração ao vivo. Este documento registra **de onde veio cada informação**, o que é fato publicado pela própria empresa e o que é inferência nossa.

## O limite: o traçado é ilustrativo

No produto, o perfil cultural de uma empresa é **a média do que a amostra de colaboradores responde** (regra R2 do cliente). Não temos essa amostra para nenhuma destas empresas. O que a base traz é um **traçado ilustrativo, derivado da cultura que cada uma declara no próprio site**, mapeado aos 11 temas do instrumento (`docs/cliente/04-perguntas-empresa.xlsx`). Isso está escrito em três lugares:

1. no cabeçalho de `empresas-reais.ts`, com o mapeamento tema a tema e a frase pública que sustenta cada valor;
2. na descrição institucional de cada empresa, que a tela mostra: _"Perfil ilustrativo, derivado de informação pública em <site> (consultado em 19/09/2026); a empresa responde pela própria tela"_;
3. aqui.

As respostas sintéticas voltam a cada carga da demonstração; a declaração real da gestão, feita pela tela da empresa, as substitui.

**Nenhuma pessoa real entrou na base.** O contato de cada empresa é o canal genérico do site (a Colatte publica `contato@colatte.io`; para as demais usamos `contato@<empresa>.example.com`, por não haver endereço genérico publicado). Gestor de equipe é "gestão da área", sem nome. Os e-mails da amostra são `colaborador-NN@<empresa>.example.com`. Todos os candidatos são fictícios, com empregadores anteriores marcados "(fictícia)". Nenhuma avaliação de ex-funcionário nomeada, nenhum sócio, nenhum colaborador.

## Como ler o sentido dos temas

Cada tema vai de 1 a 5 no sentido das frases de polo 1 do instrumento. Em alguns temas o 5 não é "mais" da palavra do rótulo:

| Tema (rótulo na tela)               | 5 significa                                                         | 1 significa                                       |
| ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| Orientação para resultados          | conferir cada etapa, uma coisa de cada vez, reunir informação antes | correr, alternar, decidir sem tudo                |
| Inovação                            | preferir o método já testado, esperar a mudança firmar              | adotar a novidade logo                            |
| Aprendizado e desenvolvimento       | conhecer outras atividades, começar sem todos os detalhes           | ficar na rotina principal                         |
| Foco no cliente                     | concentrar-se na própria tarefa, sem depender de interação          | trabalho que depende de conversa e de quem recebe |
| Ética, segurança e respeito         | ajustar a forma de fazer quando aperta, seguir sem confirmar        | manter o ritmo, confirmar cada etapa              |
| Execução e ritmo de trabalho        | ritmo constante, uma demanda de cada vez                            | alternar entre demandas que chegam juntas         |
| Regras, métodos e decisão           | entender a regra e as consequências antes                           | decidir rápido, tentar o jeito novo               |
| Interação social e convivência      | combinados direto com a pessoa, ajudar fora da própria tarefa       | recado curto, cada um no seu                      |
| Liderança, autonomia e aprendizagem | organizar-se sozinho depois do objetivo                             | acompanhamento próximo                            |
| Adaptação a mudanças e carreira     | reorganizar horário quando precisa, esperar a mudança firmar        | horário fixo, adotar o jeito novo logo            |
| Expectativas futuras                | aprofundar a própria área, trajetória parecida                      | aprender assuntos diferentes, mudar de caminho    |

## As cinco empresas

### EMP-04 — Colatte (vaga principal da demonstração)

- **O que faz:** sites, sistemas, automações e produtos digitais sob medida, "feitos em Cuiabá". Produtos citados no site: Crema (utilitário de música para macOS, gratuito e aberto) e Brio (gestão de clínicas de fisioterapia).
- **Setor / cidade / porte:** tecnologia — software sob medida; Cuiabá, MT; equipe pequena (porte é inferência: o site fala em "quem você conhece pelo nome" e não publica número de pessoas).
- **Contato genérico:** `contato@colatte.io` (publicado no rodapé do site).
- **Fonte:** https://www.colatte.io/ e https://www.colatte.io/software-sob-medida (consultados em 19/09/2026).
- **Frases públicas usadas:**
  - "Você conta o problema. A gente escreve o software."
  - "Sites, sistemas, automações e produtos digitais, feitos por quem você conhece pelo nome."
  - "Nenhuma linha de código antes de entender o problema. Software bom começa ouvindo."
  - "Tudo no papel antes de começar: escopo, prazo e preço. Sem letra miúda."
  - "Ciclos curtos, com você validando cada etapa. Ninguém some por três meses pra voltar com surpresa."
  - "Sem intermediários: você fala com quem escreve o código."
- **Vagas na base:** VAG-06 Assistente de Suporte e Testes de Software (em seleção, a da demonstração); VAG-07 Auxiliar Administrativo e Financeiro (aberta). Títulos são típicos do porte e do serviço; **não** são vagas publicadas pela empresa (o site não tem página de carreiras).
- **Mapeamento tema a tema** (valor da equipe → frase marcante):

  | Tema                                | Valor | Sustentação                                                                   | Fato / inferência             |
  | ----------------------------------- | ----- | ----------------------------------------------------------------------------- | ----------------------------- |
  | Orientação para resultados          | 4     | "Nenhuma linha de código antes de entender o problema" → I05                  | fato (frase do site)          |
  | Inovação                            | 2     | empresa de produtos digitais adota ferramenta nova → I06 = 1                  | inferência                    |
  | Aprendizado e desenvolvimento       | 4     | equipe pequena passa por sites, automações, consultoria → I11                 | inferência de porte           |
  | Foco no cliente                     | 2     | "Ciclos curtos, com você validando cada etapa" → I17 = 1                      | fato (frase do site)          |
  | Ética, segurança e respeito         | 4     | "Ninguém some por três meses pra voltar com surpresa" → I25                   | fato (frase do site)          |
  | Execução e ritmo de trabalho        | 2     | vários clientes ao mesmo tempo → I27                                          | inferência de porte e serviço |
  | Regras, métodos e decisão           | 2,5   | tenta o jeito novo antes de mapear tudo → I33 = 1                             | inferência                    |
  | Interação social e convivência      | 5     | "Sem intermediários: você fala com quem escreve o código" → I39               | fato (frase do site)          |
  | Liderança, autonomia e aprendizagem | 4,5   | "feitos por quem você conhece pelo nome" → I40; validação por etapa → I41 = 4 | fato + inferência             |
  | Adaptação a mudanças e carreira     | 3,5   | mesmo valor do tema vizinho (junção desfeita em 20/09) → I47                  | inferência                    |
  | Expectativas futuras                | 3,5   | produtos variados (Crema, Brio, sites) → I50                                  | inferência                    |

  A gestão (declaração pela tela, sem convite) difere da equipe em **Execução e ritmo de trabalho** (acha que se faz uma coisa de cada vez). É a divergência que a analista comenta na demonstração.

- **Amostra na base:** 10 convites de equipe respondidos e um 11º enviado em 13/09, ainda no prazo (a cena de "cobrar 1 que falta"); gestão declarou os 11 temas. Perfil **fechado** nos 11 temas. Frases eleitas para o candidato: I05, I06, I11, I17, I25, I27, I33, I39, I40, I47, I50.

### EMP-05 — Log,Lab Inteligência Digital

- **O que faz:** sistemas de gestão para o setor público (saúde, educação, contratos, risco); há mais de 20 anos no mercado; atende SES-RJ, TJMT, TCE, SEFAZ e secretarias municipais.
- **Setor / cidade / porte:** tecnologia — setor público; Cuiabá, MT, Jardim Aclimação (Av. Historiador Rubens de Mendonça, 2368); "mais de 200 colaboradores".
- **Contato genérico:** não publicado em texto; a base usa `contato@loglab.example.com`.
- **Fontes:** https://www.loglabdigital.com.br/ ; https://loglabdigital.com.br/carreira ; https://medicinasa.com.br/loglab-medsa26/ (consultados em 19/09/2026).
- **Frases públicas usadas:** "melhorar sua vida através da tecnologia"; "eficiência, inovação, integridade, excelência, ética e transparência"; "paixão pelo que fazemos e responsabilidade nas decisões"; "cultura colaborativa e o foco no desenvolvimento de talentos"; "cursos e certificações internacionais"; "CMMI Nível 5 — apenas ela e mais uma outra empresa no Brasil possuem essa chancela"; GPTW.
- **Vaga na base:** VAG-08 Analista de Suporte Júnior (Service Desk). Vaga típica do serviço (o site remete as vagas a uma plataforma externa); não é vaga publicada.
- **Mapeamento:** Orientação para resultados 4,5 (CMMI 5 → I01); Mudanças 3,5 (processo certificado → I10); Aprender 4,5 ("aprendizado constante" → I11); Foco no cliente 3 ("parceira dos nossos clientes" → I18); Segurança 4 (ética e transparência → I23 = 1, confirma cada etapa); Ritmo 3,5 (tickets e prazo → I29); Regras 4,5 (CMMI 5 → I31); Convivência 3,5 ("cultura colaborativa" → I36 = 1); Autonomia 3,5 (quality gates → I41, inferência); Carreira 3,5 (promoções internas, certificações → I50).
- **Amostra:** gestão e RH por convite, 11 convites de equipe, todos respondidos. Perfil fechado nos 11 temas.

### EMP-06 — Amaggi

- **O que faz:** companhia de grãos e fibras, da produção agrícola à originação, processamento, logística e energia renovável; fundada em 1977.
- **Setor / cidade / porte:** agronegócio e logística; matriz em Cuiabá, MT (Av. André Maggi, 303, Alvorada); "cerca de 10 mil colaboradores".
- **Contato genérico:** não publicado em texto; a base usa `contato@amaggi.example.com`.
- **Fontes:** https://www.amaggi.com.br/trabalhe-na-amaggi/ (trecho via resultado de busca; a página bloqueia leitura automática); https://www.amaggi.com.br/wp-content/uploads/2022/10/Amaggi_RS2020-comp.pdf (Relatório de Sustentabilidade); https://en.wikipedia.org/wiki/Amaggi_Group.
- **Frases públicas usadas:** missão "Contribuir com o desenvolvimento do agronegócio, agregando valores, respeitando o meio ambiente e melhorando a vida das comunidades"; valores "Integridade — ser ético, justo e coerente", "Simplicidade — foco no essencial, agilidade e simplificação", "Humildade — respeito por todas as pessoas", "Comprometimento — vestir a camisa"; "Gestão participativa: estimula a participação, promove reconhecimento e crescimento profissional"; "programas de compliance e treinamentos com colaboradores em todas as suas unidades".
- **Vaga na base:** VAG-09 Assistente de Logística — Matriz. Típica; não publicada.
- **Mapeamento:** Orientação para resultados 4 (integridade → I02); Mudanças 3,5 (procedimento de armazém → I07, inferência de setor); Aprender 3 (gestão participativa → I14 = 1); Foco no cliente 3 (comprometimento → I19 = 1); Segurança 4,5 (inferência: segurança em operação agroindustrial → I25); Ritmo 3 (rotina de armazém → I28); Regras 4 (programa de integridade → I31); Convivência 4 (humildade, gestão participativa → I38); Autonomia 3 (simplicidade → I42, inferência); Carreira 4 (safra reorganiza horários → I47, inferência de setor).
- **Amostra:** 12 convites, todos respondidos; gestão declarou. Perfil fechado.

### EMP-07 — Grupo Norte Logística

- **O que faz:** transporte, armazenagem e distribuição de cargas (carga fracionada, redespacho, operação logística) em Mato Grosso e Pará; fundada em 2010 em Novo Progresso-PA; 5 unidades.
- **Setor / cidade / porte:** distribuição e logística; sede em Cuiabá, MT, Distrito Industrial (Rua P, 204); porte não publicado.
- **Contato genérico:** não publicado em texto; a base usa `contato@gruponorte.example.com`.
- **Fonte:** https://gruponortelogistica.com.br/ (consultado em 19/09/2026).
- **Frases públicas usadas:** "Missão de ser uma solução Logistica na região"; valores "Padrão de Qualidade", "Construir Parcerias Duradouras", "Profissionais Capacitados em Todos os Setores", "Segurança em Ponto de Apoio Estratégico"; "15 Anos de Experiência".
- **Vagas na base:** VAG-10 Auxiliar de Armazém e Conferência (aberta); VAG-11 Conferente de Carga — turno da noite (processo de março de 2026, encerrado; é dele que vem a resposta antiga do candidato da demonstração). Típicas; não publicadas.
- **Mapeamento:** Orientação para resultados 3,5 (pátio de fracionada → I03 = 1, inferência); Mudanças 3,5 ("Padrão de Qualidade" → I09); Aprender 3,5 ("Profissionais Capacitados" → I15); Foco no cliente 3,5 ("Parcerias Duradouras" → I19 = 1); Segurança 4 ("Segurança em Ponto de Apoio" → I25); Ritmo 1,5 (carga fracionada alterna → I26, inferência de setor); Regras 3,5 (decisão rápida no pátio → I32, inferência); Convivência 4,5 (combinado na doca → I39, inferência); Autonomia 4,5 (cada conferente na sua doca → I40, inferência); Carreira 4 (escala muda com a rota → I47).
- **Amostra:** 11 convites, todos respondidos; gestão declarou. Perfil fechado. Três frases coincidem com as da Colatte de propósito: **I25, I39, I40**.

### EMP-08 — Bom Futuro

- **O que faz:** agricultura, pecuária, sementes, energia, serviços aeroportuários e imobiliário; "transforma terra, trabalho e tecnologia em alimento, energia e oportunidades"; fundada em 1982; 36 unidades de produção agrícola, 24 de grãos, 10 algodoeiras, 4 de sementes, 15 usinas de energia.
- **Setor / cidade / porte:** agroindústria; matriz em Cuiabá, MT (desde 2012); "mais de 8 mil colaboradores".
- **Contato genérico:** não publicado em texto; a base usa `contato@bomfuturo.example.com`.
- **Fontes:** https://bomfuturo.com.br/pt-br/sobre ; https://bomfuturo.com.br/pt-br/carreira (consultados em 19/09/2026).
- **Frases públicas usadas:** missão "Inovar na produção de commodities agrícolas, diversificar e promover a sinergia nos demais segmentos de atuação, por meio de práticas sustentáveis"; visão "Ser referência de atuação [...] socialmente justo, economicamente viável e ambientalmente correto"; valores "Comprometimento, Empreendedorismo, Ética, Simplicidade, Sustentabilidade"; "Reconhecemos e valorizamos nossos mais de 8 mil colaboradores"; "Todas as vagas também estão disponíveis para PCD"; benefício "Prêmio por Tempo de Empresa".
- **Vaga na base:** VAG-12 Auxiliar de Almoxarifado — Matriz. Típica; não publicada (as vagas reais estão em trabalheconosco.vagas.com.br/bom-futuro).
- **Mapeamento:** Orientação para resultados 4 (comprometimento → I04); Mudanças 2,5 (missão "inovar" → I08); Aprender 4 (empreendedorismo → I11); Foco no cliente 3 (sem frase que sustente; a eleita, I20, sai do ruído); Segurança 4,5 (ética, sustentabilidade → I25); Ritmo 3,5 (almoxarifado de matriz → I28, inferência); Regras 4 (ética → I31); Convivência 3,5 (simplicidade → I39); Autonomia 4 (inferência → I40); Carreira 3,5 ("Prêmio por Tempo de Empresa" → I45).
- **Amostra:** 10 convites, todos respondidos; gestão declarou. Perfil fechado.

## Empresa pedida e não incluída

- **"Log,lab"** era a grafia do pedido; confirmamos que é a **Log,Lab Inteligência Digital** (CNPJ 05.871.240/0001-85, Cuiabá), incluída como EMP-05.
- **MAP Metalúrgica Industrial** (Distrito Industrial de Cuiabá) foi considerada, mas o site institucional estava com página padrão de hospedagem em 19/09/2026 e a página de vagas retornou 404; sem texto público sobre cultura, ficou de fora.

## Candidatos

Todos fictícios (`candidatos-reais.ts`). O da demonstração é **Jonas Curvo Dorileo** (`TAL-JONAS`, candidatura `CAND-21` à VAG-06 da Colatte, sem resposta ao questionário; candidatura antiga `CAND-40` à VAG-11 da Norte Logística, respondida em março de 2026). O "gêmeo" é **Kauã Pedroso Arruda** (`TAL-KAUA`, `CAND-22`, já respondeu). A história completa está no cabeçalho do arquivo.

## Histórico (BI e "Custo de reabrir")

`outcomes.ts` traz remessas e reaberturas escritas à mão para as cinco empresas, todas ilustrativas e todas com desfecho informado pela empresa: Colatte 5 remessas e 2 reaberturas em 12 meses; Norte Logística 9 e 3; Amaggi 8 e 2; Log,Lab 5 e 1; Bom Futuro 6 e 2.

## O que fica pendente de propósito

A base é completa por decisão do dono do produto: todo candidato das vagas novas respondeu o questionário, toda amostra fechou os 11 temas e toda remessa tem desfecho. A única pendência é o candidato da demonstração, que responde ao vivo. Fora das empresas reais, a Oficina Pantanal (EMP-03) continua como o único exemplo de perfil que não fechou, por ser pedagógico, e a Cerrado (EMP-01) passou a 11 de 11 mantendo a divergência gestão × equipe em Liderança, autonomia e aprendizagem.

> 2026-09-20 — os temas voltaram a ser os 11 tópicos da planilha, com o nome do cliente. Onde o
> traçado tinha um valor para "Carreira e futuro" (junção de Adaptação com Expectativas), os dois
> temas receberam o mesmo valor; a frase eleita de Expectativas é a que já era (I50), e Adaptação
> ficou com I47.

# Acompanhamento

**Rota:** `/acompanhamento`
**Componente:** `AcompanhamentoScreen`, em
`apps/dashboard/components/iel-demo/acompanhamento/acompanhamento-screen.tsx` (gaveta em
`detalhe-da-pessoa.tsx`, leitura em `leitura.ts`)
**Persona:** Analista IEL
**Última atualização:** 2026-09-20

## O que a tela faz

Responde "e depois que contratou?". A devolutiva de um clique pergunta à empresa "contratou?", mas o
RH não volta para dizer se a pessoa ficou (00:05:33). Aqui o IEL vê quem foi contratado, o relógio
dos 90 dias, o que cada lado disse — a empresa, a própria pessoa (aos 30, 60 e 90 dias, pela tela
[Como está sendo](24-como-esta-sendo.md)) ou ninguém — e para quem ligar hoje. É a segunda metade do
ciclo, e a que não depende do RH.

## O que aparece

A tela responde duas perguntas, nesta ordem: **"para quem eu ligo hoje?"** e **"como estão os que a
gente colocou?"**. Tudo o mais é apoio.

- **Cabeçalho**: "Para quem ligar hoje e como estão as pessoas que foram contratadas."
- **Três cartões**, com nome que se entende sem legenda: **Contratados** (rodapé "que o IEL
  acompanha até os 90 dias"); **Ficaram** ("N de M", rodapé "M já passaram dos 90 dias" — só quem já
  teve tempo de ficar entra na conta; sem ninguém nos 90, mostra "—" e "ninguém passou dos 90 dias
  ainda"); **Saíram antes dos 90** (rodapé "K que só a pessoa contou", "a empresa avisou todas" ou
  "ninguém, pelo que se sabe").
- **Ligar hoje** — uma lista curta, não uma tabela, com a frase de privacidade ao lado do título
  ("O que a pessoa responde nunca vai para a empresa."). Cada item: nome · empresa, **o motivo em
  uma frase** e o botão **Ligar**, que abre a gaveta já no roteiro. Entram aqui os dois primeiros
  grupos da fila: pergunta aberta sem resposta ("Está há 45 dias e ainda não contou como está
  sendo") e saída que só um lado contou ("Contou que saiu; a empresa não avisou" / "Contou que saiu;
  a empresa diz que continua"). Vazia: "Ninguém para ligar hoje." Não há cartão para isso: a lista é
  o número.
- **Como estão os contratados** — todo mundo, uma linha por pessoa, na ordem de quem ligar primeiro:
  nome (abre a gaveta) e empresa · vaga; **"dia 45 de 90"** com uma barra fina dos 90 dias e os três
  pontos (30, 60, 90: verde respondeu, laranja aberto, cinza sem resposta, vazado ainda não chegou;
  a barra fica vermelha depois de uma saída); **uma frase só** juntando os dois lados ("Aos 60 dias
  contou que continua e que está sendo muito bom · a empresa não informou"); e a **situação** em
  badge curta: _Ligar hoje_ (laranja), _Tudo certo_ (verde), _Saiu_ (vermelho), _Sem resposta_ e
  _Antes dos 30 dias_ (cinza). No celular a tabela vira cartões empilhados. Rodapé: "A ordem é a de
  quem ligar primeiro. Ninguém aqui está em ranking."
- **Gaveta da pessoa** (`Drawer` à direita; de baixo no celular): badge, a frase de privacidade e a
  **mesma frase da linha**; **Os 90 dias** — os três marcos com Respondeu (data, Continua/Saiu · como
  está sendo, comentário), Ligar hoje (aberto há N dias), Sem resposta, Ainda não chegou (em N dias)
  ou Não se pergunta mais (depois de uma saída); **A empresa avisou alguma coisa?** — "Não. Nada
  depois do 'contratei' de dd/mm/aaaa." (e, se a pessoa contou uma saída, "A saída só está
  registrada porque a pessoa contou.") ou "Sim: continua/saiu, avisado em dd/mm/aaaa."; **Ligação**,
  com o botão **Registrar ligação**, que abre o roteiro curto para ler ao telefone (muda com a
  situação: sem resposta, saiu, os dois lados diferem, tudo certo; termina sempre com "O que você me
  contar fica só com o IEL. A empresa não vê o que você responde."), um lembrete para a analista e o
  campo "O que ouvi"; links **Abrir como a pessoa vê** (Minha candidatura) e **A pergunta que a
  pessoa recebe** (o link do check-in que a analista manda). Vindo do botão **Ligar**, a gaveta já
  abre com o roteiro à mostra.
- **Estado vazio**: "Ninguém contratado ainda. A lista começa quando uma empresa responder
  'contratei' a um envio."

As frases de uma linha, para os três casos da base (`leitura.ts`, `fraseDaLinha` e
`motivoDaLigacao`):

| Pessoa | Ligar hoje                                         | Frase da linha                                                                      | Badge      |
| ------ | -------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------- |
| Marcos | Está há 45 dias e ainda não contou como está sendo | Está há 45 dias e ainda não contou como está sendo · a empresa não informou         | Ligar hoje |
| Renata | Contou que saiu; a empresa não avisou              | Contou que saiu · a empresa não avisou                                              | Saiu       |
| Júlia  | —                                                  | Aos 60 dias contou que continua e que está sendo muito bom · a empresa não informou | Tudo certo |

Vocabulário: nada de "marco", "janela", "check-in", "retenção" ou "acompanhamento encerrado" em
texto de tela — é "aos 30 dias", "ainda não contou", "contou que saiu", "tudo certo". "Como está
sendo" é sempre a palavra (Muito ruim … Muito bom), nunca o número da escala; não há nota nem
ranking de pessoas.

## De onde vêm os dados hoje

`getAcompanhamento` (já ordenado por urgência e memorizado), `getRegisteredReferrals` (a data em que
a empresa informou a permanência), `getApplication`, `getTalent`, `getCompany`, `getJob`; a base de
demonstração vem de `fixtures/acompanhamento.ts` (Júlia, Marcos e Renata na Horizonte Alimentos) e
dos check-ins em `state.checkIns`. A leitura de cada linha (estado, relógio, roteiro) é calculada em
`leitura.ts`, função pura sobre `SituacaoDeContratacao` — a mesma `motivoDaLigacao` alimenta o grupo
"Ligar para quem foi contratado" do Início, para o motivo não existir em duas versões. A anotação da
ligação fica no `localStorage`
do navegador, por candidatura, como o roteiro da empresa. Relógio em `DEMO_REFERENCE_DATE`.

## Ações do usuário

- Abrir a gaveta de uma pessoa (pelo nome, ou pelo botão Ligar, já no roteiro) — estado local.
- **Registrar ligação** → guarda "o que ouvi" no navegador (`mind-rh:ligacao-acompanhamento:<id>`);
  não dispara ação do reducer.
- Abrir a Minha candidatura da pessoa e a tela do check-in.

Não existe nenhuma ação que envie algo para a empresa.

## Backend futuro

- Fila lida do serviço de acompanhamento (contratação + check-ins), com o "hoje" real.
- Registro da ligação como evento do IEL (quem ligou, quando, o que ouviu), interno.
- Envio do link do check-in por SMS/WhatsApp aos 30, 60 e 90 dias, com o estado do envio na gaveta.

## Regras e limites

- O que a pessoa responde é dela e **nunca vai para a empresa** (PRODUTO.md §5.1 e §5.6): a tela diz
  isso escrito e a gaveta não tem botão que compartilhe nada com a empresa.
- Quando só a pessoa disse que saiu, a tela diz que "a empresa ainda não informou" — nunca que a pessoa
  denunciou algo. As duas fontes ficam registradas, nenhuma sobrescreve a outra.
- "Como está sendo" aparece como rótulo escrito; a pessoa não vira nota e a ordem da fila é de
  urgência de ligação, não de mérito.
- Cada marco fica aberto 30 dias; passado isso, aparece como "Sem resposta" e não é mais cobrado.
- Retenção: até 12 meses depois da contratação (`analysis/acompanhamento.ts`).

## Ligações

Entra por: menu **Seleção → Acompanhamento** (com o contador de "ligar hoje") e pelo grupo **Ligar
para quem foi contratado** da fila de [Visão geral](01-visao-geral.md). Sai para:
[Minha candidatura](23-minha-candidatura.md) e [Como está sendo](24-como-esta-sendo.md).

## Histórico

- 2026-09-20 — reorganizada para clareza. O dono do produto achou a tela confusa ("a legenda das
  coisas, nome de tabelas, fluxo"): quatro cartões (um deles, "Empresa não informou 3", era ruído
  quando eram 3 de 3), abas que misturavam urgência com desfecho (Ligar hoje × Saíram × Em dia), duas
  colunas para comparar ("o que a pessoa disse / o que a empresa disse"), estados longos ("Saiu — só
  a pessoa avisou") e um relógio ("aos 30 dias · aberto há 15") que exigia saber o que é marco e
  janela. A tela passou a responder as duas perguntas da analista, na ordem: **Ligar hoje** (lista
  com o motivo em uma frase e o botão Ligar) e **Como estão os contratados** (uma frase por pessoa,
  "dia N de 90", badge de uma palavra). Saíram as abas, a coluna dupla e o cartão "Empresa não
  informou" (virou o fim da frase da linha). O motivo de ligação passou a ser uma função só, usada
  aqui e no Início.
- 2026-09-19 — criada.

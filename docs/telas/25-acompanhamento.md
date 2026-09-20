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

- **Cabeçalho**: "Quem foi contratado, o que cada lado disse e para quem ligar hoje."
- **Quatro cartões**: em acompanhamento (contratados informados pela empresa); **para ligar hoje**
  (pergunta aberta sem resposta — cada uma fica aberta 30 dias); **continuam na empresa** (X de N,
  com quantos saíram antes dos 90 dias e quantas dessas saídas só a pessoa contou); **empresa não
  informou** (nada depois do "contratei").
- **Abas** Todos · Ligar hoje · Saíram · Em dia, com contador, e ao lado a frase de privacidade:
  "O que a pessoa responde nunca vai para a empresa."
- **A fila**, uma linha por pessoa, na ordem de quem ligar primeiro (pergunta aberta há mais tempo →
  saída que a empresa não informou → o resto): nome (abre a gaveta), empresa · vaga; "na empresa há
  N dias" com o relógio ("aos 30 dias · aberto há 15", "próxima pergunta aos 90 dias, em 15 dias",
  "acompanhamento encerrado"); **o que a pessoa disse** (Continua/Saiu · rótulo escrito de "como está
  sendo" · o marco · o comentário); **o que a empresa disse** (Continua/Saiu/Não informou); e o
  **estado**: _Ligar hoje_ (atenção), _Saiu — só a pessoa avisou_ (difere), _Empresa e pessoa dizem
  coisas diferentes_ (difere), _Saiu_, _Sem resposta_ (janela fechou), _Antes dos 30 dias_ (neutros),
  _Em dia_ (combina).
- **Gaveta da pessoa** (`Drawer` à direita; de baixo no celular): estado e a frase de privacidade; **os
  90 dias** — os três marcos com Respondeu (data, Continua/Saiu · como está sendo, comentário), Ligar
  hoje (aberto há N dias), Sem resposta, Ainda não chegou (em N dias) ou Não se pergunta mais (depois
  de uma saída); **o que a empresa disse** e quando — ou "Nada depois do 'contratei' de dd/mm/aaaa",
  e, se a pessoa contou uma saída, "A saída só está registrada porque a pessoa contou; a empresa
  ainda não informou"; **Ligação**, com o botão **Registrar ligação**, que abre o roteiro curto para
  ler ao telefone (muda com a situação: sem resposta, saiu, divergência, em dia; termina sempre com
  "O que você me contar fica só com o IEL. A empresa não vê o que você responde."), um lembrete para a
  analista e o campo "O que ouvi"; links **Abrir como ela vê** (Minha candidatura) e **A pergunta que
  ela recebe** (o link do check-in que a analista manda).
- **Estado vazio**: "Ninguém em acompanhamento ainda. A fila começa quando uma empresa responder
  'contratei' a um envio."

Nas colunas da tabela, "como está sendo" é sempre a palavra (Muito ruim … Muito bom), nunca o número
da escala; não há nota nem ranking de pessoas.

## De onde vêm os dados hoje

`getAcompanhamento` (já ordenado por urgência e memorizado), `getRegisteredReferrals` (a data em que
a empresa informou a permanência), `getApplication`, `getTalent`, `getCompany`, `getJob`; a base de
demonstração vem de `fixtures/acompanhamento.ts` (Júlia, Marcos e Renata na Horizonte Alimentos) e
dos check-ins em `state.checkIns`. A leitura de cada linha (estado, relógio, roteiro) é calculada em
`leitura.ts`, função pura sobre `SituacaoDeContratacao`. A anotação da ligação fica no `localStorage`
do navegador, por candidatura, como o roteiro da empresa. Relógio em `DEMO_REFERENCE_DATE`.

## Ações do usuário

- Trocar de aba e abrir a gaveta de uma pessoa — estado local.
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

- 2026-09-19 — criada.
- 2026-09-20 — removida a linha de rodapé da fila ("a ordem é a de quem ligar primeiro… ninguém aqui está em ranking").

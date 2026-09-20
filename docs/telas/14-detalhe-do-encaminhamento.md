# Detalhe do encaminhamento

**Rota:** `/encaminhamentos/[referralId]`
**Componente:** `ReferralDetailScreen`, em
`apps/dashboard/components/iel-demo/referrals/referrals-screens.tsx`
**Persona:** Analista IEL e gestor da empresa destinatária
**Última atualização:** 2026-09-19

## O que a tela faz

Mostra o conteúdo exato do encaminhamento e é onde o retorno da empresa aparece para a analista. É
o ponto em que a decisão volta da empresa para o IEL — e, desde 2026-09-19, também o **desfecho**:
quem foi contratado, quem não foi e quem saiu antes de 90 dias.

Intenção e resultado são coisas diferentes e aparecem separadas: "quero entrevistar" é o que a
empresa pretende fazer; "contratou" é o que aconteceu. O ciclo do IEL parava na primeira, e era
justamente a segunda que faltava — "o RH não dá retorno pra gente, de contratado" (00:05:33).

## O que aparece

- **Mensagem enviada** à empresa.
- **Perfis compartilhados** — um bloco por pessoa, com o que foi congelado no envio.
- **Retorno da empresa** — botões de decisão e o pedido de esclarecimento do gestor.
- **Resumo do desfecho** (visão da analista) — "2 de 3 com desfecho informado", quantas contratações,
  quantas saídas antes de 90 dias e há quantos dias alguém está sem resposta. É com isso que a
  analista cobra, que é o trabalho real dela: "a gente tem que ficar em cima" (00:44:09).
- **Etiqueta de desfecho por pessoa**, com o motivo que a empresa informou, quando informou.

## De onde vêm os dados hoje

`getReferral` e seletores de talento e análise, aplicados sobre o retrato guardado no registro.
`getReferralOutcomeSummary` para o desfecho e para o tempo de espera; a captura em si acontece na
página que a empresa abre ([Relatório para a empresa](20-relatorio-para-a-empresa.md)).

## Ações do usuário (persona de gestor)

- Registrar decisão sobre um perfil — `manager-decision` (interesse em entrevista, não avançou).
- Pedir esclarecimento ao IEL — `manager-clarification-request`.

O **desfecho** não se registra aqui: ele é respondido pela empresa na página por link, sem login. A
analista lê, e o botão que ela usa é o de copiar o link para cobrar.

## Backend futuro

- Decisão da empresa vira evento com autoria, data e justificativa opcional, alimentando o
  acompanhamento do IEL.
- O retorno passa a atualizar a etapa da candidatura no sistema de recrutamento de origem.
- Acesso da empresa ao material compartilhado expira; depois disso, o detalhe mostra o registro sem
  os dados pessoais.

## Regras e limites

- A empresa vê apenas o que foi compartilhado, nada além.
- A decisão é humana e registrada como tal. Nenhuma recomendação automática decide por ela.
- "Não avançou" é decisão da empresa sobre o processo, não avaliação da pessoa exibida ao candidato.
  **"Não contratou" segue o mesmo princípio**: é o processo da empresa, não uma nota sobre alguém.
- O desfecho é agregado por empresa para virar indicador e não identifica o candidato fora do IEL
  (PRODUTO.md §5.6). Nem o nome nem o motivo aparecem no relatório da empresa depois de registrados
  como avaliação — o que a empresa vê é a própria resposta.

## Ligações

Vem de: [Encaminhamentos](13-encaminhamentos.md),
[Painel da empresa](02-painel-da-empresa.md).
Entra em: [Pendências](11-pendencias.md), quando o gestor pede esclarecimento.

## Histórico

- 2026-09-19 — criada.
- 2026-09-19 — mostra o desfecho informado pela empresa (C3), o que está pendente e há quanto tempo.

# Detalhe do encaminhamento

**Rota:** `/iel/encaminhamentos/[referralId]`
**Componente:** `ReferralDetailScreen`, em
`apps/dashboard/components/iel-demo/referrals/referrals-screens.tsx`
**Persona:** Analista IEL e gestor da empresa destinatária
**Última atualização:** 2026-09-19

## O que a tela faz

Mostra o conteúdo exato do encaminhamento e é onde a empresa responde. É o único ponto do protótipo
em que a decisão volta da empresa para o IEL, fechando o ciclo.

## O que aparece

- **Mensagem enviada** à empresa.
- **Perfis compartilhados** — um bloco por pessoa, com o que foi congelado no envio.
- **Retorno da empresa** — botões de decisão e o pedido de esclarecimento do gestor.

## De onde vêm os dados hoje

`getReferral` e seletores de talento e análise, aplicados sobre o retrato guardado no registro.

## Ações do usuário (persona de gestor)

- Registrar decisão sobre um perfil — `manager-decision` (interesse em entrevista, não avançou).
- Pedir esclarecimento ao IEL — `manager-clarification-request`.

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

## Ligações

Vem de: [Encaminhamentos](13-encaminhamentos.md),
[Painel da empresa](02-painel-da-empresa.md).
Entra em: [Pendências](11-pendencias.md), quando o gestor pede esclarecimento.

## Histórico

- 2026-09-19 — criada.

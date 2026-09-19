# Preparação do encaminhamento

**Rota:** `/iel/vagas/[jobId]/encaminhamento`
**Componente:** `apps/dashboard/components/iel-demo/referrals/referral-preparation-screen.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Fecha a jornada: reúne os perfis escolhidos para uma vaga, mostra exatamente o que a empresa vai
receber e registra o encaminhamento. É o ponto em que a informação interna do IEL para de circular.

## O que aparece

- **Lista da vaga** — os candidatos adicionados, com o resumo que será compartilhado. Estado vazio
  próprio quando ninguém foi adicionado.
- **Mensagem para a empresa** — texto que acompanha o encaminhamento.
- **Prévia** (`referrals/referral-preview-dialog.tsx`) — a visão da empresa, antes de registrar.

- **Link do relatório para a empresa** (`referrals/report-link.tsx`), disponível depois de
  registrar o encaminhamento. Leva para [Relatório para a empresa](20-relatorio-para-a-empresa.md).

## De onde vêm os dados hoje

`state.referralList[jobId]`, mais os seletores de talento, análise e evidência compartilhável.

## Ações do usuário

- Remover alguém da lista — `remove-from-referral-list`.
- Abrir a prévia do que a empresa recebe.
- Registrar o encaminhamento — `register-referral`, que congela um retrato das informações naquele
  momento.

## Backend futuro

- O envio deixa de ser simulado: e-mail ou integração com o sistema da empresa, com comprovante.
- O "retrato congelado" vira versão imutável armazenada, para que alteração posterior no perfil não
  reescreva o que a empresa recebeu.
- Entram base legal e prazo de retenção por compartilhamento, com registro de consentimento do
  talento quando for o caso.

## Regras e limites

- Só sai informação marcada como **compartilhável**. Nota interna do IEL nunca acompanha o
  encaminhamento.
- O que a empresa recebe é o que está na prévia — sem campo escondido.

## Ligações

Vem de: [Mesa de seleção](04-mesa-de-selecao.md), [Comparação](05-comparacao.md).
Entra em: [Encaminhamentos](13-encaminhamentos.md).

## Histórico

- 2026-09-19 — criada.
- 2026-09-19 — registra o link do relatório para a empresa (S3), gerado após o encaminhamento.

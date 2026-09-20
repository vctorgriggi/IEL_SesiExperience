# Importação de planilha

**Rota:** `/vagas/[jobId]/importar`
**Componentes:** `apps/dashboard/components/iel-demo/import/import-screen.tsx`,
`import/upload-step.tsx`, `import/review-step.tsx`, `import/decision-group.tsx`,
`import/import-history.tsx`, `import/import-entry.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/spreadsheet-import.ts`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Traz para dentro da Central a planilha de candidatos que o IEL já exporta do Empregare, com o
percentual de match técnico junto. Sem ela a mesa de seleção não teria com o que comparar cada linha,
e a integração dependeria de uma API que ninguém confirmou existir.

Atende **M6**.

## Os três passos

A trilha no topo é **orientação, não navegação**: os passos não são clicáveis. Quem volta, volta pelo
botão do passo em que está, e o caminho é o mesmo em qualquer direção.

1. **Enviar** — o arquivo, com a planilha de exemplo disponível para quem só quer ver a demonstração.
2. **Conferir** — cada linha classificada antes de aplicar: o que entra como pessoa nova, o que
   atualiza alguém que já existe, o que está duplicado e o que não dá para ler. Nada é aplicado sem
   esta tela.
3. **Aplicar** — o resumo do que entrou, e o histórico de importações passadas.

## O que aparece

- **Trilha** dos três passos, com o atual destacado.
- **Envio** do arquivo e atalho para a planilha de exemplo.
- **Revisão** agrupada por decisão, com o motivo de cada classificação.
- **Resultado** com a contagem por grupo.
- **Histórico** de importações da vaga.

## De onde vêm os dados hoje

- `getJob`, `getCompany` e `getImportHistory`, em `state/selectors.ts`.
- A leitura e a classificação ficam em `analysis/spreadsheet-import.ts`.
- A planilha de exemplo vem de `fixtures/planilha-exemplo.ts` (`loadExampleSpreadsheet`).

## Ações do usuário

- Aplicar a importação — `import-spreadsheet`, que grava os talentos importados e o registro da
  importação.

## Backend futuro

- Upload real de CSV/XLSX com o layout que o IEL exporta, mapeamento de colunas configurável e o
  match técnico entrando como dado de origem declarada.
- Idempotência por identificador de origem: reimportar a mesma planilha não duplica ninguém.
- O arquivo enviado fica retido apenas pelo tempo necessário ao processamento.

## Regras e limites

- **Conferência humana obrigatória.** Nenhuma linha é aplicada sem passar pelo passo de revisão —
  importação silenciosa é o oposto de decisão explicável.
- **Procedência preservada.** Cada registro importado guarda de onde veio, para que a mesa de seleção
  possa dizer a origem de cada informação.
- **Dado mínimo.** Só entram as colunas que a análise usa.

## Ligações

Vem de: [Vagas](03-vagas.md) e [Mesa de seleção](04-mesa-de-selecao.md). Alimenta a mesa de seleção
daquela vaga.

## Histórico

- 2026-09-19 — criada, documentando a tela que chegou com a interface Mind RH.

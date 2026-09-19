# Relatório para a empresa

**Rota:** `/iel/relatorio/[token]`
**Componentes:** `apps/dashboard/components/iel-demo/referrals/referral-report-screen.tsx`,
`referrals/report-link.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/referral-report.ts`
**Persona:** a empresa que recebeu o encaminhamento, sem login
**Última atualização:** 2026-09-19

## O que a tela faz

É **o produto da empresa**, não uma tela do IEL mostrada a ela. Responde uma pergunta: quem eu chamo
para entrevistar, e por quê.

Por isso não tem menu, não tem filtro e não tem ranking geral da vaga. São as até cinco pessoas
enviadas, na ordem de quanto combinam, com o que a empresa precisa para decidir a ordem das conversas.

Atende **S3**.

## O que não atravessa esta página

`getReferralReport` é o recorte, e ele deixa de fora (PRODUTO.md §5.1):

- outros candidatos da vaga;
- resposta individual de colaborador;
- resposta do candidato ao questionário;
- anotação interna do IEL.

## O que aparece

- **Cabeçalho** da vaga e da empresa.
- **Uma seção por pessoa encaminhada**, na ordem da aderência, com as iniciais no lugar da foto.
- **Cinco barrinhas por pessoa**, uma por eixo, com rótulo curto que cabe num celular.
- **Legenda escrita por extenso**: combina, parecido, difere, sem resposta. Este é o único lugar da
  demonstração em que a cor carrega o dado, e é exatamente por isso que as quatro faixas aparecem com
  todas as letras.
- **O eixo que mais diverge** em destaque, porque é o que vira pergunta na entrevista.

## De onde vêm os dados hoje

- `getReferralReport`, em `state/selectors.ts`, que monta o recorte.
- `analysis/referral-report.ts` para o token, a leitura por eixo e os rótulos.

## Ações do usuário

- Nenhuma ação de reducer: é leitura. A empresa não tem área logada — mais uma etapa para ela foi
  apontada como risco de não adesão (Won't).

## Backend futuro

- Token com prazo e revogação, entregue por e-mail no encaminhamento.
- Devolutiva de um clique (C3) para a empresa dizer o que aconteceu com cada pessoa, realimentando a
  calibração do corte — sempre por decisão humana.

## Regras e limites

- **Recorte mínimo.** Só o necessário para decidir a ordem das conversas.
- **Sem login e sem menu.** A empresa não navega pela Central.
- **Cor nunca sozinha.** A legenda nomeia as quatro faixas por escrito.
- **Aderência, nunca "chance de sucesso".** O relatório não prediz desempenho e não substitui o
  técnico nem o comportamental.

## Ligações

Vem de: [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md) e
[Detalhe do encaminhamento](14-detalhe-do-encaminhamento.md), que geram o link.

## Histórico

- 2026-09-19 — criada, documentando a tela que chegou com a interface Mind RH.

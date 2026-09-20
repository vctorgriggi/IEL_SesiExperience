# Relatório para a empresa

**Rota:** `/iel/relatorio/[token]`
**Componentes:** `apps/dashboard/components/iel-demo/referrals/referral-report-screen.tsx`,
`referrals/devolutiva-da-empresa.tsx`, `referrals/report-link.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/referral-report.ts`,
`analysis/devolutiva.ts`
**Persona:** a empresa que recebeu o encaminhamento, sem login
**Última atualização:** 2026-09-19

## O que a tela faz

É **o produto da empresa**, não uma tela do IEL mostrada a ela. Responde duas perguntas, nesta
ordem: quem eu chamo para entrevistar, e — quando o processo terminar — o que aconteceu com cada um.

Por isso não tem menu, não tem filtro e não tem ranking geral da vaga. São as até cinco pessoas
enviadas, na ordem de quanto combinam, com o que a empresa precisa para decidir a ordem das conversas.

Atende **S3** e é a superfície de captura de **C3** (devolutiva de um clique). A captura mora aqui,
e não numa tela nova, porque é aqui que o RH já está e porque "se colocar mais uma etapa para a
empresa, eles não vão fazer" (00:23:28).

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
- **A devolutiva de um clique**, um bloco por pessoa, no rodapé do cartão dela.

## De onde vêm os dados hoje

- `getReferralReport`, em `state/selectors.ts`, que monta o recorte.
- `analysis/referral-report.ts` para o token, a leitura por eixo e os rótulos.

## Ações do usuário

A tela deixou de ser só leitura em 2026-09-19: é aqui que a empresa fecha o ciclo (C3). Continua sem
login e sem área logada — mais uma etapa para ela foi apontada como risco de não adesão (Won't).

**Primeiro momento — contratou?**

- "Contratei" / "Não contratei" — `company-outcome`. Um clique por pessoa, sem confirmação e sem
  botão de enviar. É a resposta inteira: tudo o que vem depois é opcional.
- **Motivo, opcional.** Depois do clique, uma lista curta de causas operacionais em chips e um campo
  de texto livre. Nunca obrigatório, nunca formulário. A lista de "não contratou" usa os mesmos ids
  do histórico simulado (`fixtures/outcomes.ts`), para o gráfico de motivos do BI não virar duas
  listas paralelas.
- "Corrigir" — `clear-company-outcome`. Existe porque o clique é um só: sem volta, o botão errado
  viraria indicador errado.

**Segundo momento — ficou?**

Separado do primeiro, porque não acontece no mesmo dia.

- Enquanto os 90 dias correm, a tela só deixa a porta aberta: "se ela sair antes de 90 dias, avise
  por aqui". Não insiste.
- Quando o prazo fecha, a tela **pergunta de novo sozinha**: "Faz 90 dias. Fulana continua na
  equipe?", com "Continua" e "Saiu antes de 90 dias" — `company-retention`. O estado é derivado em
  `estadoDaPermanencia`, nunca gravado: o que muda com o tempo não pode ficar congelado num campo.
- Motivo da saída em lista própria, também opcional e também operacional.

## Backend futuro

- Token com prazo e revogação, entregue por e-mail no encaminhamento.
- Lembrete automático quando os 90 dias fecham e a empresa não voltou: hoje a pergunta só aparece
  para quem reabre o link.
- Desfecho vira evento com autoria e hora do lado do servidor, e não campo dentro do encaminhamento.

## Regras e limites

- **Recorte mínimo.** Só o necessário para decidir a ordem das conversas.
- **Sem login e sem menu.** A empresa não navega pela Central.
- **Cor nunca sozinha.** A legenda nomeia as quatro faixas por escrito.
- **Aderência, nunca "chance de sucesso".** O relatório não prediz desempenho e não substitui o
  técnico nem o comportamental.
- **Finalidade escrita, uma vez.** Uma linha curta no topo diz para que serve o clique: o IEL mede
  quantas contratações duram, por empresa (PRODUTO.md §5.6). O desfecho não vira avaliação da pessoa
  e não vai para o currículo dela.
- **Motivo nunca sensível.** A lista fica em causa operacional — salário, horário, transporte,
  contrato, desistência. Nada de saúde, família ou desempenho pessoal.
- **"Não contratei" é sobre o processo, não sobre a pessoa.** Mesmo princípio de
  [Detalhe do encaminhamento](14-detalhe-do-encaminhamento.md).
- **O desfecho calibra, não decide.** O que a empresa responde alimenta o indicador e serve para
  discutir o corte de 35% com número; o corte continua sendo do cliente e configurável (PRODUTO.md
  §5.7).

## Ligações

Vem de: [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md) e
[Detalhe do encaminhamento](14-detalhe-do-encaminhamento.md), que geram o link.

## Histórico

- 2026-09-19 — criada, documentando a tela que chegou com a interface Mind RH.
- 2026-09-19 — deixa de ser só leitura: recebe a devolutiva de um clique (C3), em dois momentos
  (contratou / ficou), com motivo opcional e operacional.

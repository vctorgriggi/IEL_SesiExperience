# Telas do protótipo IEL

Um arquivo por tela do protótipo em `/iel`. Cada arquivo descreve o que a tela faz, o que aparece
nela, de onde vêm os dados hoje, o que um backend real faria no lugar da base fictícia e quais
regras do edital e da LGPD a tela precisa respeitar.

Estes documentos são a referência de produto do protótipo. O código diz _como_; aqui está _o quê_ e
_por quê_.

## Regra de manutenção

**Toda alteração que muda o comportamento visível de uma tela atualiza o arquivo dela no mesmo PR.**

Isso vale para: bloco novo ou removido, mudança no que a tela calcula ou mostra, ação nova do
usuário, mudança de persona que enxerga a tela, mudança de origem de dado e mudança de regra de
conformidade. Refatoração sem efeito visível não exige atualização.

Tela nova exige arquivo novo aqui, numerado na sequência, e uma linha neste índice. A mesma regra
está registrada em `app/docs/repo-definition-of-done.md`.

Ao atualizar um arquivo, acrescente uma linha em **Histórico** com a data e o que mudou, e ajuste a
data de **Última atualização** no cabeçalho.

## Índice

| #   | Tela                                                               | Rota                                | Persona                        |
| --- | ------------------------------------------------------------------ | ----------------------------------- | ------------------------------ |
| 01  | [Visão geral](01-visao-geral.md)                                   | `/iel`                              | Analista IEL                   |
| 02  | [Painel da empresa](02-painel-da-empresa.md)                       | `/iel`                              | Gestor                         |
| 03  | [Vagas](03-vagas.md)                                               | `/iel/vagas`                        | Analista IEL, Gestor           |
| 04  | [Mesa de seleção](04-mesa-de-selecao.md)                           | `/iel/vagas/[jobId]`                | Analista IEL                   |
| 05  | [Comparação entre candidatos](05-comparacao.md)                    | `/iel/vagas/[jobId]/comparar`       | Analista IEL                   |
| 06  | [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md) | `/iel/vagas/[jobId]/encaminhamento` | Analista IEL                   |
| 07  | [Talentos](07-talentos.md)                                         | `/iel/talentos`                     | Analista IEL                   |
| 08  | [Perfil do talento](08-perfil-do-talento.md)                       | `/iel/talentos/[talentId]`          | Analista IEL                   |
| 09  | [Empresas](09-empresas.md)                                         | `/iel/empresas`                     | Analista IEL                   |
| 10  | [Contexto da empresa](10-contexto-da-empresa.md)                   | `/iel/empresas/[companyId]`         | Analista IEL, Gestor           |
| 11  | [Pendências](11-pendencias.md)                                     | `/iel/pendencias`                   | Analista IEL, Gestor           |
| 12  | [Resposta do destinatário](12-resposta-do-destinatario.md)         | `/iel/pendencias/[id]/responder`    | Talento ou gestor destinatário |
| 13  | [Encaminhamentos](13-encaminhamentos.md)                           | `/iel/encaminhamentos`              | Analista IEL, Gestor           |
| 14  | [Detalhe do encaminhamento](14-detalhe-do-encaminhamento.md)       | `/iel/encaminhamentos/[referralId]` | Analista IEL, Gestor           |
| 15  | [Mapa de Cultura](15-mapa-de-cultura.md)                           | `/iel/mapa-de-cultura`              | Analista IEL                   |
| 16  | [Fontes de dados](16-fontes-de-dados.md)                           | `/iel/fontes-de-dados`              | Analista IEL                   |
| 17  | [Questionário do candidato](17-questionario-do-candidato.md)       | `/iel/candidatura/[id]/fit`         | Candidato, sem login           |
| 18  | [Consulta ao colaborador](18-consulta-ao-colaborador.md)           | `/iel/consulta/[token]`             | Colaborador, sem login         |
| 19  | [Importação de planilha](19-importacao-de-planilha.md)             | `/iel/vagas/[jobId]/importar`       | Analista IEL                   |
| 20  | [Relatório para a empresa](20-relatorio-para-a-empresa.md)         | `/iel/relatorio/[token]`            | Empresa, sem login             |

## Modelo para uma tela nova

```markdown
# <Nome da tela>

**Rota:** `/iel/...`
**Componente:** `apps/dashboard/components/iel-demo/<pasta>/<arquivo>.tsx`
**Persona:** <quem enxerga>
**Última atualização:** AAAA-MM-DD

## O que a tela faz

Um parágrafo: a pergunta que ela responde na jornada.

## O que aparece

Um item por bloco visível, na ordem da tela.

## De onde vêm os dados hoje

Seletores e fixtures usados, e o que é estado local.

## Ações do usuário

Uma linha por ação, com a ação do reducer que ela dispara.

## Backend futuro

O que substitui a base fictícia: origem, leitura, escrita e integração.

## Regras e limites

O que o edital e a LGPD exigem desta tela.

## Ligações

Telas de entrada e de saída.

## Histórico

- AAAA-MM-DD — criada.
```

## Contexto comum a todas as telas

- **Base fictícia.** Nenhum dado é real, nada sai do navegador, nenhuma mensagem é enviada. A faixa
  de demonstração fica visível em todas as telas.
- **Estado no cliente.** `features/iel-demo/state/demo-provider.tsx` guarda o estado, o reducer em
  `state/reducer.ts` aplica as ações e `state/storage.ts` persiste no `localStorage` apenas o que
  divergiu da base inicial.
- **Telas leem seletores, nunca fixtures direto**, para que a fonte mock possa ser trocada por
  serviços reais sem reescrever a interface.
- **Personas** vêm da barra "Visualizar como — demonstração": é recorte de dados para apresentação,
  não autenticação.

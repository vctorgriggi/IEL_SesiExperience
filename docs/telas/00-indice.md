# Telas do protótipo IEL

Um arquivo por tela do Mind RH, que vive na raiz do app (`/`; `/iel/**` só redireciona). Cada arquivo descreve o que a tela faz, o que aparece
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

| #   | Tela                                                               | Rota                                    | Persona                         |
| --- | ------------------------------------------------------------------ | --------------------------------------- | ------------------------------- |
| 01  | [Visão geral](01-visao-geral.md)                                   | `/`                                  | Analista IEL                    |
| 02  | [Painel da empresa](02-painel-da-empresa.md)                       | `/`                                  | Gestor                          |
| 03  | [Vagas](03-vagas.md)                                               | `/vagas`                            | Analista IEL, Gestor            |
| 04  | [Mesa de seleção](04-mesa-de-selecao.md)                           | `/vagas/[jobId]`                    | Analista IEL                    |
| 05  | [Comparação entre candidatos](05-comparacao.md)                    | `/vagas/[jobId]/comparar`           | Analista IEL                    |
| 06  | [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md) | `/vagas/[jobId]/encaminhamento`     | Analista IEL                    |
| 07  | [Talentos](07-talentos.md)                                         | `/talentos`                         | Analista IEL                    |
| 08  | [Perfil do talento](08-perfil-do-talento.md)                       | `/talentos/[talentId]`              | Analista IEL                    |
| 09  | [Empresas](09-empresas.md)                                         | `/empresas`                         | Analista IEL                    |
| 10  | [Contexto da empresa](10-contexto-da-empresa.md)                   | `/empresas/[companyId]`             | Analista IEL, Gestor            |
| 11  | [Pendências](11-pendencias.md)                                     | `/pendencias`                       | Analista IEL, Gestor            |
| 12  | [Resposta do destinatário](12-resposta-do-destinatario.md)         | `/pendencias/[id]/responder`        | Talento ou gestor destinatário  |
| 13  | [Encaminhamentos](13-encaminhamentos.md)                           | `/encaminhamentos`                  | Analista IEL, Gestor            |
| 14  | [Detalhe do encaminhamento](14-detalhe-do-encaminhamento.md)       | `/encaminhamentos/[referralId]`     | Analista IEL, Gestor            |
| 15  | [Mapa de Cultura](15-mapa-de-cultura.md)                           | aba de `/empresas/[companyId]`      | Analista IEL                    |
| 16  | [Fontes de dados](16-fontes-de-dados.md)                           | `/fontes-de-dados`                  | Analista IEL                    |
| 17  | [Questionário do candidato](17-questionario-do-candidato.md)       | `/candidatura/[id]/fit`             | Candidato, sem login            |
| 18  | [Consulta ao colaborador](18-consulta-ao-colaborador.md)           | `/consulta/[token]`                 | Colaborador, sem login          |
| 19  | [Importação de planilha](19-importacao-de-planilha.md)             | `/vagas/[jobId]/importar`           | Analista IEL                    |
| 20  | [Relatório para a empresa](20-relatorio-para-a-empresa.md)         | `/relatorio/[token]`                | Empresa, sem login              |
| 21  | [Análise de aderência](21-analise-de-aderencia.md)                 | aba de `/talentos/[talentId]`       | Analista IEL                    |
| 22  | [Entrada da equipe](22-entrada-da-equipe.md)                       | `/entrar`                           | Equipe do IEL                   |
| 23  | [Minha candidatura](23-minha-candidatura.md)                       | `/candidatura/[id]`                 | Candidato, sem login            |
| 24  | [Como está sendo](24-como-esta-sendo.md)                           | `/candidatura/[id]/como-esta-sendo` | Candidato contratado, sem login |
| 25  | [Acompanhamento](25-acompanhamento.md)                             | `/acompanhamento`                   | Analista IEL                    |

## Modelo para uma tela nova

```markdown
# <Nome da tela>

**Rota:** `/...`
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

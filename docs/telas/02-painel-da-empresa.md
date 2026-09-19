# Painel da empresa

**Rota:** `/iel` (mesma rota da visão geral, com a persona de gestor)
**Componente:** `apps/dashboard/components/iel-demo/manager/manager-overview.tsx`
**Persona:** Gestor da empresa
**Última atualização:** 2026-09-19

## O que a tela faz

Mostra ao gestor só o que é dele: as vagas da própria empresa, os perfis que o IEL compartilhou e as
perguntas dirigidas à sua equipe. É o recorte que demonstra que o produto não expõe a base de
talentos do IEL para a empresa.

## O que aparece

- **Cabeçalho** com nome, setor e localização da empresa.
- **Três contadores** — vagas da empresa, perfis compartilhados e retornos pendentes.
- **Perguntas do IEL sobre a sua equipe** — pendências dirigidas ao gestor, aguardando resposta.
- **Perfis encaminhados pelo IEL** — apenas os perfis de encaminhamentos registrados para esta
  empresa.
- **Contexto registrado das suas equipes** — condições de trabalho informadas, com o estado de cada
  uma (confirmado, da descrição, a confirmar).

## De onde vêm os dados hoje

`getCompany`, `getJobsByCompany`, `getReferralsByCompany`, `getTeamsByCompany` e
`getOpenClarifications`, sempre filtrados por `persona.companyId`.

## Ações do usuário

- Abrir uma pendência para responder.
- Abrir um perfil encaminhado.

## Backend futuro

- O recorte por empresa deixa de ser filtro de tela e vira autorização no servidor: o gestor
  autentica, e a consulta só devolve o que pertence à empresa dele.
- Compartilhamento de perfil vira registro com escopo e prazo — quem viu, o quê e até quando.

## Regras e limites

- A empresa **não** acessa a base de talentos do IEL. Vê apenas perfis compartilhados em um
  encaminhamento.
- Respostas da equipe sobre cultura chegam agregadas e sem identificação.

## Ligações

Entra em: [Detalhe do encaminhamento](14-detalhe-do-encaminhamento.md),
[Pendências](11-pendencias.md), [Contexto da empresa](10-contexto-da-empresa.md).

## Histórico

- 2026-09-19 — criada.

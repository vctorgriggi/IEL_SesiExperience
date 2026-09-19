# Perfil do talento

**Rota:** `/iel/talentos/[talentId]` — com `?vaga=<jobId>` para ler o perfil no contexto de uma vaga
**Componentes:** `apps/dashboard/components/iel-demo/talents/talent-profile-screen.tsx`,
`talents/talent-fit-view.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Reúne tudo que a base sabe sobre uma pessoa e, quando há vaga no contexto, a leitura dessa pessoa
naquela vaga. Sem vaga, a tela diz explicitamente que compatibilidade depende da oportunidade e não
mostra análise por critério.

## O que aparece

**Sem vaga no contexto**, a tela não tenta responder o que não dá: diz que o percentual depende da
oportunidade e lista as candidaturas da pessoa, com o resultado de cada uma e a data.

**Com vaga no contexto**, a leitura fica em `talents/talent-fit-view.tsx`:

- **Cabeçalho** com iniciais no lugar de foto, a função e as ações da vaga (marcar para envio,
  respeitando o limite de cinco).
- **Aderência** naquela vaga, com o denominador à vista e a leitura eixo a eixo.
- **Leitura em texto**, vinda de `analysis/fit-insights.ts`. O componente troca o jargão do
  instrumento pelo vocabulário da tela na fronteira da apresentação: "eixo" vira "ponto do dia a
  dia", "coleta dirigida" vira "pergunta à pessoa", "encaminhamento" vira "envio do currículo". O
  texto de origem mora em `features/`, que é domínio de outra mão; enquanto não for reescrito lá, a
  troca acontece aqui.

## De onde vêm os dados hoje

`getTalent`, `getApplicationsByTalent`, `getJob`, `getCompany`, `getTalentJourney`,
`getReferralListSelection` e `getAdherence`, este último sobre `analysis/adherence.ts`.

## Ações do usuário

- Marcar para envio — `add-to-referral-list` (limite `REFERRAL_LIMIT`, cinco).
- Remover da lista — `remove-from-referral-list`.

## Backend futuro

- Perfil consolidado a partir das fontes integradas, com precedência declarada quando duas fontes
  divergirem (hoje a divergência aparece como estado, e é assim que deve continuar).
- Nota interna vira registro com autoria e visibilidade garantida no servidor.
- Avaliações externas continuam preservando a escala de origem; nada é convertido em nota própria.

## Regras e limites

- Os eixos descrevem **condição de trabalho**, nunca traço de personalidade ou dado de saúde.
- Nota interna é interna: não acompanha encaminhamento.
- Toda informação exibida aponta origem, fonte e data.

## Ligações

Vem de: [Talentos](07-talentos.md), [Mesa de seleção](04-mesa-de-selecao.md),
[Comparação](05-comparacao.md).
Entra em: [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md).

## Histórico

- 2026-09-19 — criada, já com o bloco do Mapa de Cultura.

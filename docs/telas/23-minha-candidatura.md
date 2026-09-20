# Minha candidatura

**Rota:** `/iel/candidatura/[applicationId]`
**Componente:** `apps/dashboard/components/iel-demo/candidate/minha-candidatura-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/situacao-da-candidatura.ts`
**Persona:** o próprio candidato, sem login
**Última atualização:** 2026-09-19

## O que a tela faz

Responde ao candidato a única pergunta que ele tem: **em que pé está e o que acontece agora.**

Até aqui o produto era assimétrico. A pessoa respondia 10 frases sobre como prefere trabalhar,
apertava enviar, lia "você não precisa fazer mais nada agora" e acabava ali: não sabia se tinha sido
encaminhada, não tinha para onde voltar e, quando a empresa não seguia, ninguém lhe dizia nada. O
cliente já se importa com isso — o limite de 5 currículos por vaga existe _"para trabalhar com a
expectativa do candidato"_ (00:33:30).

Esta é a casa da pessoa no produto. O questionário (`/fit`) e a conversa (`/conversa`) são tarefas
que saem daqui e voltam para cá.

## O que aparece

- **A situação**, como título da tela: o estado dito em voz alta, com um ícone tingido ao lado
  (nunca sozinho).
- **"O que acontece agora"**, em passos numerados: de quem é a vez, o que essa pessoa faz e em
  quanto tempo. **Nenhum estado termina em silêncio** — este bloco nunca vem vazio.
- **O caminho de seguir**, quando existe: a quem recorrer, pelo mesmo contato que mandou o link.
- **A ação principal**, quando a vez é da pessoa: responder, responder mesmo assim (fora do prazo)
  ou mudar as respostas. Quando a vez é do IEL ou da empresa, não há botão — e a tela diz por quê.
- **"O que você respondeu"**: os temas em que combinou com a empresa e aqueles em que ficou
  diferente, **em palavra, nunca em percentual**.
- **"O que está registrado sobre você"** (`clarifications/talent-transparency.tsx`), com os
  registros, a procedência e **"Seus direitos"** — corrigir a resposta e pedir para sair.
- **"A vaga"**: os quatro campos de `getCandidateJobView` e a frase de que o nome da empresa só
  aparece na entrevista.
- **Rodapé de demonstração**: nada é enviado de verdade e o link abre direto.

## Os seis estados

| Estado           | Quando                                      | Título que a pessoa lê              |
| ---------------- | ------------------------------------------- | ----------------------------------- |
| `sem-resposta`   | sem resposta de fit, dentro dos 2 dias (R7) | Falta você responder                |
| `prazo-vencido`  | sem resposta de fit, passados os 2 dias     | O prazo para responder terminou     |
| `em-analise`     | respondeu, ainda não encaminhada            | Suas respostas chegaram             |
| `enviado`        | em remessa registrada, decisão pendente     | Seu currículo foi enviado à empresa |
| `quer-conversar` | `managerDecision: 'quero-entrevistar'`      | A empresa quer conversar com você   |
| `nao-seguiu`     | `managerDecision: 'nao-avancar'`            | Esta vaga seguiu com outras pessoas |

A decisão da empresa vence o resto: quem recebeu um "quero entrevistar" não precisa ler que o
currículo foi enviado.

## Quando a empresa não segue

É o texto mais delicado do produto, e cada escolha tem um porquê:

- **O sujeito é a vaga, não a pessoa.** "Esta vaga seguiu com outras pessoas" descreve o processo;
  "você foi reprovado" descreveria a pessoa — e a decisão da empresa não é sobre ela.
- **Nada de "reprovado", "descartado" ou "não qualificado".**
- **Tom neutro, nunca vermelho.** Vermelho, na paleta, quer dizer "difere". Aqui não diferiu nada:
  uma empresa escolheu.
- **Nenhum motivo interno.** A justificativa que a empresa registra (`ReferralItem.managerNote`) é
  devolutiva dela para o IEL (PRODUTO.md §5.1); o módulo nem a lê.
- **Sem falsa esperança.** Não se promete outra vaga nem prazo para ela.
- **O que continua é o currículo, não as respostas.** O aceite prometeu que as respostas ficam
  ligadas a esta candidatura (`CANDIDATE_CONSENT_TEXT.retention`) e §5.6 determina que, encerrada a
  vaga, elas não são reaproveitadas sem novo aceite. A tela diz exatamente isso: o currículo segue
  no banco de talentos, e numa vaga nova o IEL pede que a pessoa responda de novo.
- **O bloco de temas ganha uma frase a mais** neste estado: "Estes temas não decidiram sozinhos: a
  empresa escolhe olhando o currículo inteiro." Sem ela, a lista do que ficou diferente, logo
  abaixo da notícia, se leria como o motivo.

## De onde vêm os dados hoje

- `getSituacaoDaCandidatura` e `getTemasDoCandidato`, em
  `features/iel-demo/analysis/situacao-da-candidatura.ts`.
- Compostos sobre seletores já existentes: `getApplication`, `getFitResponse`, `getTalentJourney`
  (que resolve encaminhada / quis entrevistar / não avançou), `getAdherence`,
  `getCandidateJobView` e `getTalent`.
- O prazo sai de `CANDIDATE_FIT_DEADLINE_DAYS` (2 dias, R7) contra `DEMO_REFERENCE_DATE` — relógio
  determinístico, nunca `new Date()` solto.
- Os rótulos dos temas vêm de `COPY.axis`, o glossário de `features/iel-demo/copy.ts`.

## Ações do usuário

- **Responder / Responder mesmo assim / Mudar minhas respostas** — leva ao questionário
  (`/fit`), que grava com `answer-fit-questionnaire`. A tela em si não dispara nenhuma ação: é de
  leitura.
- **Ver meus dados** — abre o recolhido da transparência.

## Backend futuro

- O mesmo token opaco do questionário abre esta página; sem login e sem cadastro.
- Os prazos ("até 15 dias", "até 2 dias") passam a sair do processo real da vaga, não de texto fixo.
- "Pedir para sair" vira fluxo com registro: revogação de consentimento (LGPD, art. 18, IX) com
  data, origem e efeito sobre a candidatura.
- A mudança de estado dispara aviso por SMS ou WhatsApp, com o mesmo texto desta tela.

## Regras e limites

- **R5, sem exceção.** O nome da empresa não aparece em nenhum estado, inclusive em
  "a empresa quer conversar": quem revela o nome é a pessoa do IEL, na ligação. A vaga só chega por
  `getCandidateJobView`, que é um tipo fechado de quatro campos.
- **Nunca posição, ranking ou comparação com outros candidatos.**
- **Nunca percentual.** §5.1 permite mostrar a aderência da própria pessoa, mas um número numa tela
  sobre a própria vida vira nota. O que volta é palavra, com a frase de que não é nota e não mede
  desempenho.
- **Nunca anotação interna nem devolutiva da empresa** (§5.1).
- **Sem login e sem cadastro** (00:08:01).
- **Celular primeiro**: 390×844 sem rolagem horizontal, alvos de 48px, corpo de 15px.
- `h1` na situação, `h2` por bloco, `h3` dentro deles; cor sempre acompanhada da palavra.

## Ligações

Vem de: [Questionário do candidato](17-questionario-do-candidato.md), que termina aqui, e do link
da candidatura. Alimenta: o próprio questionário, quando a pessoa ainda tem algo a responder.

## Histórico

- 2026-09-19 — criada, com os seis estados e o texto de quando a empresa não segue.

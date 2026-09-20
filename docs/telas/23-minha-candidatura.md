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
- **A ação principal**, quando a vez é da pessoa: responder, responder mesmo assim (fora do prazo),
  mudar as respostas ou, depois de contratada, **contar como está sendo**. Quando a vez é do IEL ou
  da empresa, não há botão — e a tela diz por quê. Corrigir uma resposta já dada aparece em
  contorno (`peso: 'discreta'`): é direito, não pendência.
- **"O que você já contou"** (só para quem foi contratado): uma linha por resposta — "Aos 30 dias,
  você disse que continua na empresa e que está sendo bom." — e a frase de que a empresa não vê.
- **"O que você respondeu"**: os temas em que combinou com a empresa e aqueles em que ficou
  diferente, **em palavra, nunca em percentual**.
- **"O que está registrado sobre você"** (`clarifications/talent-transparency.tsx`), com os
  registros, a procedência e **"Seus direitos"** — corrigir a resposta e pedir para sair.
- **"A vaga"**: os quatro campos de `getCandidateJobView` e a frase de que o nome da empresa só
  aparece na entrevista.
- **Rodapé de demonstração**: nada é enviado de verdade e o link abre direto.

## Os sete estados

| Estado           | Quando                                          | Título que a pessoa lê                                          |
| ---------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `sem-resposta`   | sem resposta de fit, dentro dos 2 dias (R7)     | Falta você responder                                            |
| `prazo-vencido`  | sem resposta de fit, passados os 2 dias         | O prazo para responder terminou                                 |
| `em-analise`     | respondeu, ainda não encaminhada                | Suas respostas chegaram                                         |
| `enviado`        | em remessa registrada, decisão pendente         | Seu currículo foi enviado à empresa                             |
| `quer-conversar` | `managerDecision: 'quero-entrevistar'`          | A empresa quer conversar com você                               |
| `nao-seguiu`     | `managerDecision: 'nao-avancar'`                | Esta vaga seguiu com outras pessoas                             |
| `contratado`     | `getSituacaoDeContratacao` devolve uma situação | Você foi contratado (ver [abaixo](#quando-a-empresa-contratou)) |

A decisão da empresa vence o resto, e a contratação vence a decisão: quem tem "contratei"
registrado não precisa ler que a empresa quer conversar — já conversou, e deu certo.

## Quando a empresa contratou

Até 19/09 a tela parava em "a empresa quer conversar": **o candidato nunca ficava sabendo, por
aqui, que tinha sido contratado.** O estado `contratado` fecha o ciclo e abre a segunda metade
dele — a pergunta ao próprio contratado, aos 30, 60 e 90 dias
([Como está sendo?](24-como-esta-sendo.md)).

Um id, três textos, porque o que muda não é o estado (a pessoa foi contratada) e sim o que se sabe
da permanência e **de quem veio**:

| Variante                                               | Tom       | Título                          | O que muda                                                                                                                                                                                                                                                               |
| ------------------------------------------------------ | --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Continua (ou ninguém disse nada)                       | `combina` | Você foi contratado             | "Parabéns! A empresa desta vaga contratou você há N dias." Os três passos: aos 30/60/90 o IEL pergunta; não é avaliação e a empresa não vê; e o passo do calendário — a vez é dela ("Contar como está sendo"), a próxima pergunta em N dias, ou as perguntas terminaram. |
| A pessoa contou que saiu (vale a última resposta dela) | `neutro`  | Você contou que saiu da empresa | "Obrigado por avisar. Sair antes dos 90 dias acontece, não é um erro seu e não vira nota no seu currículo." O currículo continua, a pessoa do IEL fala com ela, a empresa não vê. "Corrigir o que respondi" em contorno.                                                 |
| A empresa informou saída e a pessoa não disse nada     | `neutro`  | Você foi contratado nesta vaga  | O mais delicado: a pessoa pode não saber que a empresa avisou. Diz o que o IEL sabe e de onde veio, **sem o motivo** que a empresa deu (§5.1), e deixa a porta aberta: "Contar como foi", em contorno, quando já há um marco alcançado.                                  |

Quando as duas fontes discordam e a pessoa disse que continua, a tela dela mostra o que **ela**
disse: a divergência é assunto da analista.

O marco que o botão abre sai de `marcoParaContar`: o pendente; sem pendente, o da última resposta
(corrigir é direito); sem resposta e com a empresa dizendo que saiu, o mais recente alcançado.

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

- `getSituacaoDaCandidatura`, `getTemasDoCandidato` e `marcoParaContar`, em
  `features/iel-demo/analysis/situacao-da-candidatura.ts`.
- A contratação e o que a pessoa já contou vêm de `getSituacaoDeContratacao` (`state/selectors.ts`),
  com os rótulos de `analysis/acompanhamento.ts`.
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
- **Contar como está sendo / Mudar o que respondi / Corrigir o que respondi / Contar como foi** —
  levam a [Como está sendo?](24-como-esta-sendo.md), que grava com `answer-check-in`.
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

Vem de: [Questionário do candidato](17-questionario-do-candidato.md), que termina aqui, do link
da candidatura e de [Como está sendo?](24-como-esta-sendo.md). Alimenta: o próprio questionário,
quando a pessoa ainda tem algo a responder, e a pergunta dos 30, 60 e 90 dias, depois de
contratada.

## Histórico

- 2026-09-19 — criada, com os seis estados e o texto de quando a empresa não segue.
- 2026-09-19 — estado `contratado`: a pessoa fica sabendo que foi contratada, lê o que acontece nos
  90 dias, ganha o botão "Contar como está sendo" quando há pergunta aberta e o bloco "O que você já
  contou". Três textos para o id: continua, contou que saiu, saída informada pela empresa (neutro,
  sem motivo).

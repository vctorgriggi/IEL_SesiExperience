# Minha candidatura

**Rota:** `/candidatura/[applicationId]`
**Componente:** `apps/dashboard/components/iel-demo/candidate/minha-candidatura-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/situacao-da-candidatura.ts`
**Persona:** o próprio candidato, sem login
**Última atualização:** 2026-09-23

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

Enxuta por pedido do dono do produto (20/09/2026): o título do estado, **uma** linha, no máximo
**dois** passos e, quando a vez é da pessoa, **um** botão. O resto fica em "Seus dados", a um toque.

- **A situação**, como título da tela, com um ícone tingido ao lado (nunca sozinho), e uma linha.
- **"O que acontece agora"**, em um ou dois passos numerados: de quem é a vez, o que essa pessoa
  faz e em quanto tempo. **Nenhum estado termina em silêncio.**
- **O botão**, quando a vez é da pessoa: responder, responder mesmo assim (fora do prazo),
  confirmar as respostas reaproveitadas ou, depois de contratada, **contar como está sendo**.
  Quando a vez é do IEL ou da empresa, não há botão. **Não existe "mudar minhas respostas"**: a
  resposta é uma só e vale 12 meses.
- **"Seus dados"** (`clarifications/talent-transparency.tsx`), recolhido num toque, com: **"Suas
  respostas"** (a cena e o grau no vocabulário da escala, frase a frase — nunca "combinou / ficou
  diferente", que é comparação), até quando valem, **"O que você já contou"** (só para quem foi
  contratado), **"A vaga"** (os quatro campos de `getCandidateJobView`, sem o nome da empresa), os
  registros, a procedência e **"Seus direitos"** — "Precisa corrigir algo? Fale com a pessoa do
  IEL que mandou este link." e pedir para sair.
- Sem rodapé de demonstração.

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
| Continua (ou ninguém disse nada)                       | `combina` | Você foi contratado             | "Parabéns! A empresa contratou você há N dias. Aos 30, 60 e 90 dias o IEL pergunta como está sendo — e a empresa não vê." Dois passos: não é avaliação, quem lê é o IEL; e o do calendário — a vez é dela ("Contar como está sendo"), a próxima pergunta em N dias, ou as perguntas terminaram. |
| A pessoa contou que saiu (vale a resposta dela)        | `neutro`  | Você contou que saiu da empresa | "Obrigado por avisar. Sair antes dos 90 dias acontece, não é um erro seu e não vira nota no seu currículo." O currículo continua, a pessoa do IEL fala com ela, a empresa não vê. Sem botão de corrigir.                                                                                         |
| A empresa informou saída e a pessoa não disse nada     | `neutro`  | Você foi contratado nesta vaga  | O mais delicado: a pessoa pode não saber que a empresa avisou. Diz o que o IEL sabe e de onde veio, **sem o motivo** que a empresa deu (§5.1), e deixa a porta aberta: "Contar como foi", em contorno, enquanto ela não respondeu nenhum marco.                                                |

Quando as duas fontes discordam e a pessoa disse que continua, a tela dela mostra o que **ela**
disse: a divergência é assunto da analista.

O marco que o botão abre sai de `marcoParaContar`: o pendente; sem pendente e sem resposta nenhuma,
com a empresa dizendo que saiu, o mais recente alcançado. Marco respondido não reabre: a resposta é
uma só.

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
- **O currículo continua, e as respostas valem por 12 meses** (§5.6): numa vaga nova o IEL
  pergunta só o que faltar.
- **Nada de "combinou / ficou diferente"** logo abaixo da notícia: se leria como o motivo. O que a
  pessoa vê em "Seus dados" é o que ela respondeu, frase a frase, sem comparação.

## De onde vêm os dados hoje

- `getSituacaoDaCandidatura` e `marcoParaContar`, em
  `features/iel-demo/analysis/situacao-da-candidatura.ts`; as respostas, de `respostasResolvidas`.
- A contratação e o que a pessoa já contou vêm de `getSituacaoDeContratacao` (`state/selectors.ts`),
  com os rótulos de `analysis/acompanhamento.ts`.
- Compostos sobre seletores já existentes: `getApplication`, `getFitResponse`, `getTalentJourney`
  (que resolve encaminhada / quis entrevistar / não avançou), `getCandidateJobView` e `getTalent`.
- O prazo sai de `CANDIDATE_FIT_DEADLINE_DAYS` (2 dias, R7) contra `DEMO_REFERENCE_DATE` — relógio
  determinístico, nunca `new Date()` solto.

## Ações do usuário

- **Responder agora / Responder mesmo assim / Confirmar minhas respostas** — leva ao questionário
  (`/fit`), que grava com `answer-fit-questionnaire` ou `reuse-fit-answers`. A tela em si não
  dispara nenhuma ação: é de leitura.
- **Contar como está sendo / Contar como foi** — levam a [Como está sendo?](24-como-esta-sendo.md),
  que grava com `answer-check-in`.
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
- **Nunca percentual, nunca comparação, nunca "você é assim".** O que volta é o que a pessoa
  respondeu, no vocabulário da escala.
- **Nunca "responder de novo".** A resposta é uma só e vale 12 meses; corrigir é pelo IEL.
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
- 2026-09-23 — enxugamento pedido pelo dono do produto: título + uma linha + no máximo dois passos
  + um botão; textos dos estados com metade das palavras; "Seus dados" recolhido num toque, com
  "Suas respostas" em vocabulário de escala no lugar de "combinou / ficou diferente"; sem "mudar
  minhas respostas", "corrigir o que respondi" ou rodapé de demonstração. Estado sem resposta: de
  274 para 70 palavras.

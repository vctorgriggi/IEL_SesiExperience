# Como está sendo?

**Rota:** `/iel/candidatura/[applicationId]/como-esta-sendo`
**Componente:** `apps/dashboard/components/iel-demo/candidate/check-in-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/acompanhamento.ts` e
`getSituacaoDeContratacao` em `state/selectors.ts`; o marco a abrir vem de `marcoParaContar` em
`analysis/situacao-da-candidatura.ts`
**Persona:** o próprio candidato, já contratado, sem login
**Última atualização:** 2026-09-19

## O que a tela faz

Pergunta à própria pessoa, aos 30, 60 e 90 dias da contratação, **"Você continua na empresa? Como
está sendo?"** — por link, no celular, em um minuto.

O cliente disse que _"o RH não dá retorno pra gente, de contratado"_ (00:05:33). Enquanto só a
empresa puder dizer se a pessoa ficou, a permanência aos 90 dias fica refém dela. Esta tela é a
segunda fonte, e é também o único momento em que o produto cuida de quem hoje responde 10 frases e
some depois de contratado. A analista vê as duas fontes lado a lado; para o indicador, vale a
saída (`analytics.ts`).

## A condição para a verdade

**A empresa nunca vê a resposta.** Está escrito no aceite (`CHECK_IN_CONSENT_TEXT.whoSees`), na
abertura, no rodapé de cada pergunta, na tela de fim e na
[Minha candidatura](23-minha-candidatura.md). Quem sabe que o chefe vai ler não diz que o turno
mudou e o transporte não deu; a frase é o que torna a resposta possível, não um aviso legal.

## Base legal

Finalidade nova, aceite próprio — LGPD, art. 7º, I. A pessoa consentiu em responder ao questionário
da vaga, não em ser acompanhada depois de contratada. Por isso o aceite é o passo 0, ocupa a tela
inteira, **nasce desmarcado** e sem ele as perguntas não abrem. A versão do texto
(`CHECK_IN_CONSENT_VERSION`) vai gravada em cada resposta (art. 8º, § 4º). Os cinco itens do
aceite aparecem palavra por palavra, todos no mesmo corpo de leitura.

## O que aparece

- **Abertura e aceite.** Quem pergunta (o IEL), por quê (a pessoa chegou àquela vaga por ele e foi
  contratada), quanto tempo leva e que a empresa não vê. Etiquetas "2 perguntas · 1 minuto · aos 30
  dias". Depois, o cartão do aceite (para quê, o que guardamos, quem vê, por quanto tempo, seus
  direitos), a caixa desmarcada, o botão que só habilita com ela marcada e a saída "Ver minha
  candidatura".
- **Pergunta 1 — "Você continua na empresa?"** Dois alvos de 60px: "Sim, continuo" e "Não, saí".
- **Pergunta 2 — "Como está sendo?"** (ou **"Como estava sendo?"**, para quem disse que saiu).
  Cinco alvos com o rótulo escrito, de "Muito ruim" a "Muito bom" (`COMO_ESTA_SENDO_LABEL`). Nunca
  só número ou carinha.
- **"Quer contar algo?"** — opcional, até 200 letras, com contador. A dica diz sobre o que é: o
  trabalho, o horário, o que combinaram e o que mudou — "não precisa falar de ninguém". O botão
  diz "Enviar sem recado" enquanto o campo está vazio.
- **"Obrigado!"** — o que a pessoa disse, devolvido em palavra, e **"O que acontece agora"** em
  três passos: o IEL lê e a empresa não vê; a próxima pergunta (ou que essa era a última); e, para
  quem continua, que pode responder de novo (vale a última). Para quem disse que saiu: a pessoa do
  IEL fala com ela sobre outras vagas e o currículo continua no banco. Botão "Ver minha
  candidatura" e "Responder de novo".
- **A vaga sem o nome da empresa** na etiqueta, como nas outras telas do candidato (R5).

## Os estados sem pergunta

| Situação                                               | Título que a pessoa lê              | O que a tela diz                                                                            |
| ------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| Candidatura inexistente                                | Este link não abriu                 | Confira a mensagem e abra o link inteiro.                                                   |
| Sem contratação registrada                             | Esta pergunta ainda não é para você | O IEL só pergunta depois que a empresa registra a contratação; acompanhe pela candidatura.  |
| Marco já respondido (`marcoParaContar` é o da última)  | Você já respondeu                   | O que disse, aos N dias, e o recado se houver. "Mudar minha resposta" abre tudo de novo.    |
| Marco não alcançado (`proximoMarco` existe)            | Ainda não é hora                    | "Você foi contratado há N dias; a próxima pergunta é em M dias, por este mesmo link."       |
| Janelas fechadas sem resposta                          | As perguntas terminaram             | O tempo das perguntas passou; para contar algo, o Centro de Empregos.                       |
| Empresa informou saída antes dos 30 dias, sem resposta | Não há pergunta aberta agora        | Neutro, sem o motivo que a empresa deu; se não estiver certo, procure o Centro de Empregos. |

Depois dos 30 dias, quem teve a saída informada pela empresa **ainda pode responder**: o seletor
fecha as pendências, mas `marcoParaContar` devolve o marco mais recente alcançado, para a versão
dela ser ouvida — é o que faz a divergência aparecer para a analista.

## Fechar e voltar

O que já foi respondido fica no navegador da pessoa (`shared/use-rascunho.ts`), com a versão do
aceite e o marco: rascunho de outro texto ou de outro marco é descartado. Ela volta ao passo em que
parou, com um aviso em `role="status"`. O rascunho some no envio. **Rascunho não é resposta**: o
reducer só recebe a resposta completa, com o aceite.

## De onde vêm os dados hoje

- `getSituacaoDeContratacao` (dias na empresa, marcos pendentes, respostas já dadas, o que cada
  fonte disse) e `getCandidateJobView`, em `state/selectors.ts`.
- O texto do aceite, os rótulos e o limite do recado vêm de `analysis/acompanhamento.ts`.
- A base semeada (`fixtures/acompanhamento.ts`): Júlia (`CAND-ACOMP-01`, 75 dias, respondeu aos 30
  e aos 60), Marcos (`CAND-ACOMP-02`, 45 dias, pergunta dos 30 aberta) e Renata (`CAND-ACOMP-03`,
  70 dias, contou que saiu).

## Ações do usuário

- Aceitar e responder — `answer-check-in`, com marco, as duas respostas, o recado opcional, o
  carimbo de `nowIso()` e a versão do aceite. Um registro por marco por candidatura
  (`CHK-<candidatura>-<marco>`): responder de novo substitui, não acumula.

## Backend futuro

- O link chega por SMS ou WhatsApp no dia do marco, com token opaco; o mesmo link serve às três
  vezes.
- "Parar de receber estas perguntas" e "apagar o que respondi" viram fluxo com registro (LGPD, art.
  18, VI e IX).
- O recado livre passa por revisão humana antes de qualquer uso além da leitura da analista.

## Regras e limites

- **A empresa nunca vê** (PRODUTO.md §5.1). Nem o resumo, nem o recado, nem que a pessoa respondeu.
- **Nada de chefe, equipe, saúde ou família** (§5.2 e §10). Duas perguntas fechadas e um recado
  curto sobre o trabalho.
- **Não é avaliação da pessoa** e não vai para o currículo dela (`AVISO_DEVOLUTIVA`, do outro lado
  do mesmo ciclo).
- **Sem jargão.** "Check-in", "marco" e "acompanhamento" não aparecem em nenhuma frase que a pessoa
  lê: é "contar como está sendo", "aos 30 dias".
- **Sem login, sem cadastro, sem o nome da empresa** na tela (R5).
- **Relógio determinístico**: dias na empresa e marcos contam contra `DEMO_REFERENCE_DATE`; o
  carimbo é `nowIso()`.
- **Celular primeiro**: 390×844 sem rolagem horizontal, alvos de 48px (60px nas alternativas),
  corpo de 15px; `h1` por passo com o foco levado até ele; erro em `role="alert"`; nada só por cor.

## Ligações

Vem de: [Minha candidatura](23-minha-candidatura.md), pelo botão "Contar como está sendo". Alimenta:
[Minha candidatura](23-minha-candidatura.md) (a linha do que a pessoa já contou) e a fila de
acompanhamento da analista.

## Histórico

- 2026-09-19 — criada: a pergunta ao próprio contratado aos 30, 60 e 90 dias, com aceite próprio,
  duas perguntas fechadas, recado opcional e os estados sem pergunta.

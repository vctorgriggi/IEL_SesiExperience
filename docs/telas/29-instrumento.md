# Instrumento

**Rota:** `/instrumento`
**Componente:** `apps/dashboard/components/iel-demo/instrumento/instrumento-screen.tsx` (a tela) e
`instrumento/linha-da-frase.tsx` (uma frase)
**Regras:** `apps/dashboard/features/iel-demo/analysis/instrumento.ts` (seção "Ajuste pela analista")
**Persona:** Analista IEL
**Última atualização:** 2026-09-20

## O que a tela faz

Responde "o que estamos perguntando, e por quê?". Até 20/09 as 52 frases do cliente só existiam em
código; o dono do produto pediu "um local onde possa ver" e controlar. Aqui a analista vê o
instrumento inteiro, tema a tema, e controla duas coisas por frase: se ela está **ligada** (é
perguntada e pesa) e se ela **separa pessoas** (entra na escolha para o candidato e na aderência).
Ninguém escreve frase nova: o instrumento continua sendo o do cliente (PRODUTO.md §11.1).

## O que aparece

- **Três números**: frases ligadas de 52; temas com a frase padrão ligada, de 10; empresas com
  perfil fechado em ao menos um tema.
- **Uma explicação de duas linhas**, uma vez só: frase desligada não é perguntada nem pesa; frase
  que não separa pessoas é aquela em que quase todo mundo concorda; o que já foi respondido continua
  guardado, só sai da conta.
- **Filtros**: busca por texto (cena, frase original, subtema, id), tema, "Só ligadas", e o botão
  **Voltar ao instrumento do cliente** (desabilitado quando não há ajuste).
- **Um cartão por tema**: nome comum e título original, quantas frases e quantas ligadas, e a
  **frase padrão** em vigor — com aviso quando a de fábrica foi desligada e outra assumiu.
- **Uma linha por frase**: id, "Padrão do tema" e "Desligada" (badge cinza, com a palavra), o
  subtema, a **cena** em destaque (é o que a pessoa lê), **"Ver a frase original"** (a do cliente,
  num toque), polo (seta + "Mesmo sentido do tema" / "Invertida"), par ("Par invertido com I09" /
  "Equivale a I12"), em quantas empresas com perfil fechado ela é a escolhida do candidato, e dois
  interruptores com rótulo: **Ligada** e **Separa pessoas**. Quando uma regra impede o ajuste, o
  interruptor fica desabilitado e o motivo aparece ao lado, em laranja e por escrito.

## De onde vêm os dados hoje

- As frases: `ITENS_DO_INSTRUMENTO`, `ITEM_PADRAO_POR_TEMA`, `parDoItem` (`analysis/instrumento.ts`).
- O ajuste: `state.instrumento` (`{ desligadas, discriminaOverride }`), opcional e vazio por padrão;
  entra no delta de `state/storage.ts` e, no modo compartilhado, na sala do banco. Não muda
  `DEMO_SCHEMA_VERSION`.
- "Escolhida em N empresas": `usoDoInstrumento(state)` percorre só as empresas com resposta de
  cultura e perfil fechado, roda a mesma escolha do candidato e conta; memorizado por identidade de
  `state.cultureAnswers` e de `state.instrumento`.

## Ações do usuário

| Ação                             | Ação do reducer                         |
| -------------------------------- | --------------------------------------- |
| Ligar / desligar uma frase       | `set-instrumento-item` com `ativa`      |
| Marcar / desmarcar "separa"      | `set-instrumento-item` com `discrimina` |
| Voltar ao instrumento do cliente | `reset-instrumento`                     |

As duas são idempotentes e registram histórico ("Frase I39 (Convivência) desligada pela analista…").

### As três regras que protegem o produto (`ajustarInstrumento`)

1. **Um tema nunca fica sem frase ligada** — a última não desliga.
2. **Um tema nunca fica sem frase ligada que separe pessoas** — só elas são escolhidas para o
   candidato; a última que separa não desliga, e não pode ser desmarcada.
3. **A frase padrão pode ser desligada**, desde que outra do tema esteja ligada: a padrão passa a
   ser a primeira ligada que separa pessoas (`itemPadraoDoTema`).

A tela bloqueia antes de deixar tocar; o reducer aplica as mesmas regras e ignora um ajuste
barrado, porque não pode confiar só na tela.

### Efeito real

- `perfilDaEmpresa` ignora respostas a frases desligadas (a resposta fica guardada).
- `perguntasDoCandidato`, `perguntasQueFaltam` e `respostasResolvidas` escolhem só entre frases
  ligadas que separam pessoas, com a padrão em vigor.
- `getAdherence` → `computeAdherence` não pesa frase desligada nem frase que deixou de separar.
- `blocoDoConvite` (o bloco do colaborador e a validação da resposta) tira as desligadas do bloco;
  a ordem do rodízio não muda, para convite já enviado continuar com o mesmo bloco.

## Backend futuro

O ajuste é uma tabela pequena por organização (`item_id`, `ativa`, `discrimina`, quem, quando); as
regras de proteção ficam no serviço, não na tela. Quando houver volume, a coluna "escolhida em N
empresas" vira análise de itens de verdade (PRODUTO.md §11.5): é aqui que se veria quais frases de
fato separam pessoas.

## Regras e limites

- **Não sai das 52 frases do cliente.** A tela não cria, edita nem reordena frase.
- **Resposta é dado da pessoa.** Desligar uma frase não apaga o que foi respondido; só tira da
  conta, e a tela diz isso (LGPD, art. 6º, I e VI — finalidade e transparência).
- **Cor com significado, nunca sozinha**: "Desligada" é badge cinza com a palavra; o motivo do
  bloqueio é laranja e por escrito; os interruptores têm rótulo e `aria-describedby`.
- **Jargão só no toque**: cena em destaque; "polo" e "par" em letra pequena, com a palavra.
- **Estado compartilhado.** No modo compartilhado o ajuste vale para a sala inteira — é decisão do
  IEL, não preferência de um aparelho.

## Ligações

Entra pelo menu Sistema (antes de Integrações). Muda o que
[Questionário do candidato](17-questionario-do-candidato.md),
[Consulta ao colaborador](18-consulta-ao-colaborador.md), [Mapa de Cultura](15-mapa-de-cultura.md)
e [Análise de aderência](21-analise-de-aderencia.md) perguntam e contam.

## Em aberto

- `calcularPerfilCultural` (`analysis/culture.ts`) ainda lê o `discrimina` de fábrica para dizer se
  um **tema** fecha; o override só vale na escolha das frases e na aderência. Alinhar quando aquele
  arquivo puder mudar.
- A explicação por frase de "quase todo mundo concorda" ainda não tem número: com respostas reais,
  a tela pode mostrar a distribuição.

## Histórico

- 2026-09-20 — criada.

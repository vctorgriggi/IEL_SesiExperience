# Tour guiado

**Rota:** nenhuma — é um diálogo, alcançável do cabeçalho de qualquer tela do analista
**Componente:** `apps/dashboard/components/iel-demo/tour/tour-menu.tsx` (motor em
`features/iel-demo/tour/use-tour.ts`, registro em `features/iel-demo/tour/tours.ts`)
**Persona:** Analista IEL
**Última atualização:** 2026-09-20

## O que a tela faz

Responde "o que é cada coisa desta tela?" sem tirar a pessoa de onde ela está. O botão **Tour** fica
à direita do cabeçalho, em todas as telas do analista; abre um diálogo com uma opção por tela e, ao
escolher, destaca bloco a bloco o que cada um responde.

Serve para dois momentos diferentes: quem apresenta o produto e precisa de um roteiro na tela, e
quem entra pela primeira vez e não sabe por onde começar.

## O que aparece

- **Botão no cabeçalho**: bússola + "Tour" (só a bússola abaixo de 640px), antes das ações da tela.
- **Diálogo** com uma linha por tela: ícone, nome, a pergunta que a tela responde, o número de passos
  e o selo **esta tela** quando é a tela em que se está.
- **Balão do tour** (driver.js), com título, uma ou duas frases, o progresso ("3 de 4") e os botões
  Voltar / Próximo / Fechar. O resto da página escurece e o bloco em foco fica recortado.

## De onde vêm os dados hoje

`features/iel-demo/tour/tours.ts` — uma constante `TOURS`, com um objeto por tela. Nada vem de
estado, seletor ou fixture: o tour é texto fixo sobre a estrutura da tela.

## Ações do usuário

| Ação | O que acontece |
| --- | --- |
| Clicar em **Tour** | abre o diálogo |
| Escolher a tela em que já se está | fecha o diálogo e começa na hora |
| Escolher outra tela | navega até ela e começa quando ela termina de montar |
| Voltar / Próximo | anda entre os passos |
| Fechar ou `Esc` | encerra e devolve a tela |

Nenhuma ação do reducer é disparada: o tour não altera o estado da demonstração.

## Como acrescentar ou mudar um tour

Tudo em um arquivo só, `tours.ts`:

1. Acrescente um objeto em `TOURS` com `id`, `titulo`, `descricao`, `icone`, `rota` e `passos`.
2. Cada passo tem `titulo`, `texto` e, opcionalmente, `seletor` (o bloco destacado), `lado` e
   `alinhamento`. **Passo sem `seletor`** abre centralizado — é como cada tour começa, dizendo o que
   a tela responde antes de apontar para qualquer canto.
3. O alvo é sempre `[data-tour="…"]`, atributo escrito na marcação da tela. Nunca uma classe do
   Tailwind: classe muda no primeiro ajuste de layout e o tour quebra em silêncio.
4. Rota com identificador (`/vagas/<id>`) precisa de `casaCom`, senão o tour nunca se reconhece como
   o da tela atual.

A ordem do diálogo é a ordem do array.

## Backend futuro

Nada a fazer: o conteúdo é estático. Se um dia o tour precisar lembrar quem já viu o quê, o lugar é
o perfil da pessoa no servidor — não o `localStorage`, que é por navegador.

## Regras e limites

- **Passo cujo alvo não existe é descartado**, não quebra o tour: telas mudam e cartões somem em
  estado vazio. Um tour com um passo a menos é melhor do que um tour que estoura.
- O tour **não promete o que o produto não faz**: é leitura da tela, não argumento de venda. Onde a
  tela diz "dados simulados", o tour repete.
- Só o analista tem tour. As telas por link (candidato, colaborador, relatório da empresa) não têm
  cabeçalho e não devem ganhar um: são uma tarefa só, no celular.
- A biblioteca é **driver.js** (MIT, sem dependências). O `intro.js` foi descartado pela licença
  AGPL/comercial e o `react-joyride` por ainda declarar React 18 como par, enquanto o app está em 19.
- O balão é vestido com os tokens do tema em `app/(iel)/iel-theme.css`; nenhuma cor literal.

## Ligações

Alcançável de qualquer tela do analista. Vizinho de "Como funciona" (o método) e do assistente Mind
(a pergunta livre): os três são ajuda, em degraus diferentes.

## Histórico

- 2026-09-20 — criado.

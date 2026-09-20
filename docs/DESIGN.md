# Princípios de interface — Central de Seleção IEL

Quem usa o sistema é a analista do Centro de Empregos, que hoje monta ranking no Excel; o RH ou a gestão de uma indústria, que responde um questionário de 5 minutos; e um candidato operacional, com baixo letramento digital, no celular. **Nenhum deles é analista de dados.** Cada tela é julgada por uma pergunta: uma pessoa leiga entende o que está vendo e o que fazer em 5 segundos?

Este documento é a referência de design do protótipo. Ele tem precedência sobre gosto pessoal e sobre o que já está implementado.

## 1. Uma pergunta por tela

Cada tela responde **uma** pergunta, tem **um** número principal e **uma** ação principal. Tudo o mais é apoio e fica visualmente abaixo.

| Tela                       | Pergunta que responde                 | Número principal         | Ação principal                         |
| -------------------------- | ------------------------------------- | ------------------------ | -------------------------------------- |
| Visão geral                | O que precisa de mim hoje?            | pendências               | abrir a vaga mais urgente              |
| Vaga (mesa)                | Quem eu envio para esta vaga?         | compatíveis (≥ 35%)      | marcar até 5 para enviar               |
| Pessoa na vaga             | Esta pessoa combina com esta empresa? | % de aderência           | adicionar à lista / perguntar          |
| Empresa                    | Como se trabalha nesta empresa?       | respostas recebidas de N | cobrar quem falta / confirmar sugestão |
| Questionário (candidato)   | Como você prefere trabalhar?          | passo X de 5             | próxima                                |
| Questionário (colaborador) | Como é trabalhar aqui?                | passo X de 5             | próxima                                |
| Importar planilha          | Entrou tudo certo?                    | registros novos          | confirmar importação                   |

Se um elemento não ajuda a responder a pergunta da tela, ele sai da tela ou vai para detalhe recolhido.

## 2. Densidade: o que cabe na primeira dobra

- **Herói**: título, uma frase de contexto (≤ 90 caracteres), até **3** números. Nunca 5.
- **Chips**: até 3 visíveis. O resto fica em "mais".
- **Texto explicativo**: nunca inline em bloco. Uma explicação vira um `?` (InfoHint) ou um painel "Como funciona" recolhido, uma vez por tela — não uma vez por bloco.
- **Listas**: até 5 itens visíveis; "ver todos" abre o resto.
- **Números no mesmo bloco**: se dois números medem coisas diferentes (ex.: eixos lidos no texto vs. eixos medidos no questionário), fica um só. O outro sai.
- **Proveniência** ("500 registros de 3 fontes") não fica no herói. Fica na aba Fontes e, na tela, em um `?`.
- Corpo de texto ≥ 15px, linha ≤ 70 caracteres, espaço em branco é conteúdo.

Teste rápido: cubra a tela com a mão e descubra só a primeira dobra. Se há mais de 3 números competindo, está denso.

## 3. Linguagem: fala de gente, não de sistema

Regras de redação (inspiradas nos princípios de conteúdo do GOV.UK):

- Frases curtas, voz ativa, uma ideia por frase. Sem "a leitura depende desta oportunidade".
- Verbo no botão: "Enviar 5 currículos", não "Preparar encaminhamento".
- O número vem com a frase que o interpreta: "49% — combina com a empresa", não "49% de aderência (corte 35%)".
- Sem termo interno onde há palavra comum. Glossário obrigatório:

| Evitar (jargão)                    | Usar                                                     |
| ---------------------------------- | -------------------------------------------------------- |
| aderência                          | **combina com a empresa** (o % continua, a palavra muda) |
| eixo / eixos de fit                | **ponto do dia a dia** / "os 5 pontos"                   |
| traçado cultural                   | **como a empresa trabalha**                              |
| perfil não fecha                   | **faltam respostas** (N de M)                            |
| triagem por estado da análise      | **filtrar**                                              |
| coleta dirigida / esclarecimento   | **perguntar à pessoa**                                   |
| encaminhamento                     | **enviar currículo**                                     |
| match técnico                      | **requisitos da vaga** (%)                               |
| divergência gestão × equipe        | **gestão e equipe respondem diferente**                  |
| sem informação / sem base          | **ainda não respondeu**                                  |
| leitura assistida — determinística | **resumo** (com `?` explicando que não usa IA paga)      |
| fontes de dados / proveniência     | **de onde vem**                                          |

- Disclaimers de método ("não é teste psicométrico", "não produz nota") aparecem **uma vez**, no painel "Como funciona", não em cada tela.

## 4. Hierarquia visual

- Um ponto focal por tela (o número principal ou o ranking). O olho deve pousar nele antes de qualquer outro elemento.
- Três níveis, não mais: **destaque** (número principal, ação principal), **conteúdo** (lista, linhas), **apoio** (legendas, `?`, origem). Apoio é cinza e pequeno; não compete.
- Cor só para estado: verde combina, âmbar atenção/faltando, vermelho difere, cinza sem resposta. Sem cor decorativa em texto.
- Ícone sempre com rótulo. Nunca ícone sozinho.

## 5. Revelação progressiva

O padrão de toda lista é **resumo → detalhe**:

- Linha do ranking mostra nome, % combina, % requisitos, ação. Clicar abre a pessoa.
- Pessoa mostra o anel + 5 pontos como linhas simples ("Apoio no início — combina / difere / ainda não respondeu"). Cada linha expande para o trilho com os dois lados e a evidência.
- Empresa mostra 5 linhas com a resposta da empresa e "N de M responderam". Expande para gestão × equipe e dispersão.
- Sugestões da análise ficam num bloco só ("3 sugestões para confirmar"), não espalhadas por eixo.

## 6. Referências

- Nielsen, _10 Usability Heuristics_ — visibilidade de estado, correspondência com o mundo real, reconhecimento em vez de memória, estética minimalista.
- Few, _Information Dashboard Design_ — um painel comunica uma mensagem; decoração e redundância competem com ela.
- GOV.UK Design System, _Content design_ — escreva para quem lê pior; frases de até 25 palavras; sem jargão.
- Material Design 3 e Apple HIG — hierarquia por tamanho e espaço antes de cor; toque mínimo de 44px no celular.
- Mindsight (produto de referência do cliente) — % grande com frase interpretativa, poucos números por tela, cores só em estado.

## 7. Checklist antes de dar por pronta uma tela

- [ ] Dá para dizer em uma frase que pergunta a tela responde?
- [ ] Há um único número que salta aos olhos?
- [ ] O botão principal tem verbo e cabe em 3 palavras?
- [ ] Nenhum parágrafo explicativo inline (só `?` ou "Como funciona")?
- [ ] Nenhuma palavra da coluna "Evitar" do glossário?
- [ ] Máximo de 3 números no herói, 3 chips, 5 itens por lista visível?
- [ ] Funciona a 390px sem rolagem horizontal?
- [ ] Alguém que nunca viu o produto entenderia sem ajuda?

## 8. Diretriz visual: filosofia shadcn, marca Mind RH

Aprovada em 19/09/2026 depois de três rodadas. As seções 1–7 dizem **o que** vai na tela; esta diz **como** ela é desenhada.

### A regra

**Componentes de fábrica, sem estilo próprio por cima.** A interface usa os componentes do shadcn (estilo _new-york_) exatamente como vêm: `Card`, `Table`, `Badge`, `Tabs`, `Sidebar`, `Drawer`, `Breadcrumb`, `Tooltip`, `Progress`, `Avatar`, `DropdownMenu`, `Command`. Estrutura vem de borda e espaço, nunca de cor; **dado** pode ter cor, com as regras de "Cor nos dados" abaixo. Corpo em 14px. Sem gradiente decorativo, sem sombra além do `shadow-xs` dos cards, sem faixa colorida, sem borda-esquerda, sem parágrafo de método na tela.

Os componentes vivem em `app/packages/ui/src/components/shadcn/*` e são importados de `@workspace/ui/shadcn/<nome>`. O kit próprio do boilerplate e o tema âmbar continuam intactos para o resto do produto; o `/iel` escopa seu tema em `[data-iel-theme]`.

### Referências de origem

Os blocks oficiais do shadcn, lidos no código-fonte do registry, não de memória:

- `dashboard-01` — header de 48px com `SidebarTrigger` + `Separator` + título; _section cards_ (`CardDescription` → `CardTitle` 24px tabular → `CardAction` com `Badge outline` → `CardFooter` em duas linhas, `bg-gradient-to-t from-primary/5` e `shadow-xs`); _data table_ (`Tabs` com contadores, `Input` de filtro, "Colunas", tabela em `rounded-lg border` com header `bg-muted`, `Badge outline px-1.5 text-muted-foreground` com ícone colorido, menu `⋮`, rodapé "N de M linha(s) selecionada(s) · Linhas por página · Página X de Y"); detalhe da linha em `Drawer direction="right"`.
- `sidebar-07` — `Sidebar variant="inset" collapsible="icon"`, header com logo quadrado + nome/plano + `ChevronsUpDown`, grupos colapsáveis com `SidebarMenuSub` (a linha vertical à esquerda), `NavSecondary` em `mt-auto`, `NavUser` no rodapé, header com `Breadcrumb`.

### Escala de espaçamento (a do block, sem inventar)

Conteúdo da página `flex flex-col gap-6 px-4 py-4 md:py-6 lg:px-6`; grid de cards `gap-4`; `Card` com padding de fábrica; nunca `Card` dentro de `Card`, nunca borda dupla; título de página `text-xl font-semibold tracking-tight` + uma linha `text-sm text-muted-foreground`; título de seção `text-base font-medium`; `TableHead h-10`, `TableCell p-2`; toolbar `flex items-center justify-between gap-2`; botões `size="sm"` em header e toolbars; `Badge` `outline` ou `secondary` para etiqueta, e o badge tingido de `cores.ts` para estado (ver "Cor nos dados"); espaçamento vertical só via `gap`, nunca `mt-*` avulso; números tabulares e alinhados à direita.

### A marca no lugar dos tokens zinc

O produto é o **Mind RH**, uma solução Madvic (manual em `docs/marca/`). As cores do manual entram **nos tokens do shadcn**, não como classes novas:

| Manual     | Hex       | Token                                                                                                    |
| ---------- | --------- | -------------------------------------------------------------------------------------------------------- |
| Azul-noite | `#12182B` | `--foreground`, `--primary` e **a barra inteira** (`--sidebar`)                                          |
| Marfim     | `#F4F1EA` | `--background` (a área de trabalho) e o texto sobre a barra                                              |
| Areia      | `#E9E5DB` | `--border` e os blocos discretos (`--muted`, `--secondary`, `--accent`)                                  |
| Ardósia    | `#5B6072` | `--muted-foreground` (textos de apoio e legendas)                                                        |
| Laranja    | `#FF5A36` | `--ring`, `--brand-accent` — ponto de atenção (marca do 35%, alerta) e o item em que você está, na barra |

### A casca em azul-noite

**Mudou em 19/09/2026**, depois de a equipe dizer que a interface estava preta e branca. A barra era marfim sobre fundo branco: a tela inteira tinha uma cor só, e a marca não aparecia em lugar nenhum.

Agora a barra é o azul-noite da logo, a área de trabalho é marfim e o cartão é branco. São as duas cores da assinatura, na proporção dela — o conteúdo sobe do fundo sem precisar de sombra nem de gradiente, e o laranja fica reservado para uma coisa só dentro da barra: **onde você está** (fundo um tom acima, ícone laranja e uma lasca laranja na borda esquerda).

O jeito de fazer isso continua sendo "componente de fábrica": em vez de caçar classe por classe, os tokens do kit são **relidos dentro de `[data-sidebar='sidebar']`** (ver `iel-theme.css`). Um `Button`, um `Input` ou um `Badge` colocado na barra acerta a cor sozinho. Quem escrever componente novo para a barra não precisa saber disso.

Fonte **Red Hat Display** (Google Fonts): interface em 500, títulos em 600/700, assinaturas em caixa alta espaçada. Logo: o símbolo (ligadura d+v) no header da sidebar e no favicon; o wordmark "mind RH" nas telas por link e no relatório. Área de proteção e tamanho mínimo conforme o manual (120 px em tela; abaixo disso, o símbolo).

### Cor nos dados

A regra antiga era "cor só em ícone e ponto, badge sempre de contorno". Ela deixava os dados em preto e branco: o número de "combina" e a barra do trilho não diziam nada de relance. **Mudou em 19/09/2026:** estado e dado ganham cor, com fundo tingido, e o resto da tela continua neutro.

| Cor           | Quer dizer          | Onde aparece                                                                                                                |
| ------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Azul          | lado da **empresa** | quadrado da empresa no trilho, requisitos da vaga, gestão/equipe/média na cultura, item ativo da barra, marcados para envio |
| Verde-azulado | lado da **pessoa**  | círculo da pessoa no trilho, "combina" entre 35% e 59%, resgate                                                             |
| Verde         | **combina**         | badge Combina/Respondeu/Conectado, "combina" ≥ 60%, variação que melhorou                                                   |
| Laranja       | **atenção**         | Resgate, abaixo de 35%, faltam respostas, prazo vencido, marca do mínimo de 35%                                             |
| Vermelho      | **difere**          | badge Difere, variação que piorou                                                                                           |
| Cinza         | **sem dado**        | ainda não respondeu, aguardando, em configuração, sem variação                                                              |

- **Cor nunca sozinha; sempre com a palavra.** Todo badge de estado mantém o texto ("Combina", "Faltam respostas"); toda barra tem o número ao lado; todo selo de variação tem a frase no rodapé. Quem não distingue cor lê a mesma coisa.
- **Com critério.** Cor em: badge de estado, selo de variação, número e barra de "combina", os dois lados do trilho e o ícone de contexto dos cartões. Sem cor em: títulos, textos de apoio, bordas e fundo de card, cabeçalhos de tabela e o número principal dos KPIs (fica em `foreground`). O quadradinho de ícone do cartão é **preenchido** no tom da leitura daquele cartão — era tingido claro, e uma página inteira deles lia como branco sobre branco.
- **Sempre pelas constantes.** As classes moram em `apps/dashboard/components/iel-demo/metricas/cores.ts` (`BADGE_DE_ESTADO`, `TEXTO_DE_ESTADO`, `PREENCHIMENTO_DE_ESTADO`, `LADO`, `TRILHO`, `TONS_DA_EMPRESA`, `ICONE_TINGIDO`, `SELO`, `ITEM_ATIVO`, `barraDaAderencia`, `textoDaAderencia`, `corDaVariacao`); os tokens, em `app/(iel)/iel/iel-theme.css`. Nunca `hsl(var(--…))` solto na tela.
- **Contraste.** Texto no fundo tingido passa 4,5:1 (combina 5,8 · atenção 5,7 · difere 6,6 · neutro 5,3 · azul 6,9). O selo de variação segue quem decide o que é melhorar: com `quedaEBoa`, cair é verde.

### Três papéis, três organizações

| Papel           | Entrada                         | Organização                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Analista do IEL | app, login                      | Sidebar com **Hoje** + árvore **Empresa → Vaga** (marcados/5, alerta quando o perfil não fecha), busca ⌘K como atalho principal (campo largo no topo da barra) e a linha "Empregare · sincronizado hoje 06:00" acima do menu secundário. A planilha é plano B: menu `⋮` da vaga e detalhe do Empregare em Integrações. Dentro da vaga, abas: Candidatos · Como a empresa trabalha · Perguntas · Enviados · Requisitos · Histórico. Pessoa abre em `Drawer` sobre a vaga. |
| Empresa         | link, sem login, **sem painel** | Colaborador responde "Como é trabalhar aqui?" no celular (5 perguntas, aceite antes, token de 3 dias, uso único). RH recebe os 5 currículos numa página de leitura com % e os 5 pontos por pessoa.                                                                                                                                                                                                                                                                       |
| Candidato       | link na candidatura, celular    | Aceite → 5 perguntas, uma por tela → "Pronto" com o que acontece depois → "O que está registrado sobre você". Nunca vê o nome da empresa, o próprio %, o ranking ou outros candidatos.                                                                                                                                                                                                                                                                                   |

Só o analista tem menu. Empresa e candidato têm uma tarefa por link.

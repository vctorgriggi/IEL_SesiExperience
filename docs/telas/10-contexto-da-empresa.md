# Contexto da empresa

**Rota:** `/empresas/[companyId]` — `?aba=` abre direto numa aba (`mapa`, `colaboradores`,
`ligacao`, `custo`, `vagas`), e `&vaga=<jobId>` recorta o mapa nos inscritos daquela vaga
**Componente:** `CompanyDetailScreen`, em
`apps/dashboard/components/iel-demo/companies/companies-screens.tsx`, com
`companies/culture-profile.tsx`, `companies/culture-sample.tsx`,
`companies/custo-da-rotatividade.tsx` e `mapa-cultural/mapa-da-empresa.tsx`
**Persona:** Analista IEL e gestor da própria empresa
**Última atualização:** 2026-09-20

## O que a tela faz

Mostra como o trabalho acontece naquela empresa: as condições declaradas por equipe e o traçado
cultural respondido por gestão, RH e equipe. É onde a divergência entre o que a gestão descreve e o
que a equipe relata fica registrada em vez de ser resolvida no muque.

## O que aparece

- **Cabeçalho** com a descrição institucional declarada pela empresa.
- **Equipes e condições** — condição por condição, com estado (confirmado, da descrição, a
  confirmar) e origem.
- **Traçado cultural** (`companies/culture-profile.tsx`) — um bloco por eixo, com:
  - as vozes que responderam (gestão, RH, equipe) e a alternativa mais respondida em cada uma;
  - o estado do eixo: convergente, divergente, só a gestão respondeu, consulta à equipe sem base
    suficiente, ninguém respondeu;
  - a coluna **Equipe**: quanto as respostas variam naquele tema, em três palavras —
    **Uniforme** (desvio-padrão abaixo de 0,6 na escala de 1 a 5, sem tinta), **Variada** (abaixo de
    1,0, cinza) ou **Dividida** (1,0 ou mais: metade em "discordo" e metade em "concordo", em
    laranja de atenção, nunca vermelho — dividida não é erro). O desvio é a média dos desvios das
    frases discriminantes que fecham, de todos os que responderam (gestão, RH e equipe), então a
    divergência gestão × equipe também aparece aqui. Abaixo de `MIN_TEAM_RESPONSES` a célula mostra
    "—". O tooltip do cabeçalho diz o porquê da coluna: "Quanto as respostas da equipe variam neste
    tema. Equipe uniforme combina mais fácil — e também é mais parecida consigo mesma." É o antídoto
    contra a homogeneização (PRODUTO.md §11.3), mostrado sem moralizar. Limiares e função em
    `analysis/culture.ts` (`DESVIO_MAXIMO_UNIFORME`, `DESVIO_MAXIMO_VARIADA`, `diversidadeDoTema`);
  - a **proposta da análise** quando existe: alternativa sugerida a partir de texto que a empresa já
    escreveu, com o trecho de origem, pendente até alguém confirmar ou corrigir.
- **Amostra de colaboradores** (`companies/culture-sample.tsx`) — quem foi convidado e quem ainda
  falta, com nome, área, papel e estado do convite (pendente, respondido, expirado), mais o progresso
  "N de M" e o prazo.

  Esta lista é **da analista do IEL**. A empresa não a vê: uma linha com "respondeu em 08/09" ao lado
  do nome é exatamente a identificação que o PRODUTO.md §5.2 proíbe. O que aparece aqui é operação do
  convite, nunca resposta — desta tela não há como saber o que qualquer pessoa respondeu.

- **Competências escolhidas** — logo abaixo da descrição institucional, a linha
  "Competências escolhidas: 8 de 11", com as retiradas nomeadas ao lado. É o denominador de tudo o
  que a página mostra depois.
- **O que a empresa quer medir** (`companies/competencias-do-questionario.tsx`, primeira peça da aba
  "Como a empresa trabalha") — as 11 competências com caixa de seleção, nome e descrição curta,
  contador "8 de 11 competências · mínimo 3" e o botão **Salvar competências**. Abaixo de 3 o botão
  trava e a tela escreve a razão (`role="alert"`), em vez de só apagar o botão. Quando a amostra já
  respondeu, uma linha avisa: "As respostas dos temas retirados continuam guardadas e deixam de
  contar. Se a empresa reincluir o tema, elas voltam a valer." É a porta da **empresa** para R11; a
  outra é o formulário de convite.
- **Convidar colaboradores** — o formulário que gera um link por pessoa. O primeiro passo dele,
  antes da lista de e-mails, é a mesma escolha de competências ("O que a empresa quer medir"), todas
  marcadas por padrão; o botão de enviar só destrava com 3 ou mais. A escolha é gravada junto com os
  convites, porque é ela que define o bloco que cada pessoa vai receber.
- **Mapa de cultura** (`mapa-cultural/mapa-da-empresa.tsx`, aba só da analista) — onde esta empresa
  está e **quem na base combina com esta cultura**: a empresa no centro do plano e cada pessoa a uma
  distância que é a aderência dela, com a lista ordenada ao lado. Era tela solta no menu, aberta na
  base inteira; virou aba aqui porque o fit é da cultura da empresa, não da vaga (00:31:38), e
  porque o ranking só existe dentro do escopo de uma empresa. A leitura inteira, com o piso de
  evidência e os limites, está em [Mapa de Cultura](15-mapa-de-cultura.md).
- **Vagas associadas.**
- **Custo de reabrir** (`companies/custo-da-rotatividade.tsx`, aba só da analista) — o argumento de
  adesão do MoSCoW S5. O IEL não cobra da indústria, então a empresa não compra a etapa nova: ela é
  convencida na ligação, e o cliente disse de onde vem o convencimento — "mostrar quanto custa cada
  recontratação… a solução precisa entregar esse número de forma simples"
  (`docs/cliente/02-entendimento-do-desafio-fit-cultural.md`, §4). Traz:
  - **o número grande**: o gasto estimado da empresa com reabertura nos últimos 12 meses, lido em
    dois segundos, com a conta que o produziu na linha de baixo ("5 vagas reabertas × R$ 9.550 por
    vaga") e o cargo que mais voltou;
  - **as parcelas, a um clique** em "Ver e ajustar as parcelas": rescisão, novo processo e admissão,
    treinamento e integração, e o período até produzir como antes (dias × custo do dia). Cada uma
    com valor padrão do IEL **rotulado como estimativa**, editável em campo numérico, com o total
    reagindo na hora; "Voltar ao padrão" desfaz;
  - **o contrafactual**: "se a permanência em 90 dias subir N pontos, deixa de gastar X por ano",
    com N escolhido pela analista num seletor e a frase "projeção que depende dessa hipótese; o Mind
    RH não garante queda de rotatividade" logo abaixo;
  - **a frase para ler ao telefone**, montada a partir dos valores da tela e copiável em um clique.

  Os ajustes das parcelas ficam no navegador de quem ligou, por empresa (`mind-rh:custo:<id>`), como
  já acontece com as anotações da ligação.

## De onde vêm os dados hoje

`getCultureReading`, `getCultureAttentionPoints`, `getCompanyCultureProfile`, `getCultureInvites`,
`getCultureSampleProgress`, `getTeamsByCompany` e `getJobsByCompany`, sobre `state.cultureAnswers`,
`state.cultureInvites` e `company.cultureSuggestions`.

O custo de reabrir vem de `features/iel-demo/analysis/custo-da-rotatividade.ts`:
`getHistoricoDeReabertura` (reaberturas, vagas encerradas, cargo mais reaberto e permanência em 90
dias daquela empresa, do histórico em `fixtures/outcomes.ts`, indexado uma vez por processo),
`calcularCustoDaRotatividade` (as parcelas × as reaberturas) e `fraseParaLigacao`.

## Ações do usuário

- Responder ou corrigir um eixo do traçado — `answer-culture`.
- Convidar colaboradores — `add-culture-invites`, que gera um link por pessoa.
- Reenviar um convite em aberto — `resend-culture-invite`.
- Abrir pedido de esclarecimento sobre uma condição.
- Ajustar as parcelas do custo de reabrir e copiar a frase da ligação — estado local da tela, guardado
  no navegador por empresa.

## Backend futuro

- A consulta à equipe vira coleta real: o link já existe na demonstração
  ([Consulta ao colaborador](18-consulta-ao-colaborador.md)); falta o envio por e-mail, o token de
  uso único, a expiração e a agregação no servidor, com o resultado só liberado acima do mínimo de
  respostas (`MIN_TEAM_RESPONSES`).
- A proposta da análise passa a ser gerada no servidor a partir dos textos da empresa, com o trecho
  de origem guardado junto — sem isso a confirmação vira clique no escuro.
- Versionamento do traçado: cultura muda, e a leitura de um encaminhamento antigo precisa continuar
  correspondendo ao que valia na época.
- As parcelas do custo saem do navegador e viram parâmetro do IEL, versionado e com quem editou, para
  toda a equipe falar o mesmo número — e para a analista poder salvar o que a empresa informou.
- Com a devolutiva de um clique (C3), a permanência em 90 dias da empresa deixa de ficar abaixo do
  recorte mínimo e passa a entrar na conversa de adesão.

## Regras e limites

- Resposta da equipe é **agregada e anônima**. Quem responde sobre o próprio ambiente de trabalho
  não pode ficar identificado para a gestão.
- Abaixo de `MIN_TEAM_RESPONSES`, a tela diz que a consulta não tem base suficiente em vez de tratar
  duas respostas como "a equipe".
- Divergência entre gestão e equipe é informação, não erro a corrigir escolhendo um lado.
- **Equipe uniforme não é equipe melhor.** A coluna "Equipe" existe para lembrar que semelhança não
  é qualidade: uma equipe que responde igual combina mais fácil com quem se parece com ela. A tela
  mostra a variação e não a julga.
- Os eixos descrevem prática de trabalho, nunca traço de pessoa.
- **A empresa escolhe de 3 a 11 competências (R11).** A faixa é recusada pelo reducer
  (`set-company-competencies`), não só pelo formulário, e a recusa fica no histórico. Tema não
  escolhido continua na tabela "Como a empresa trabalha", em cinza e sem número, com a frase
  **"A empresa não pediu esta competência"**: sumir da tela esconderia o critério de quem lê o
  percentual. O contador "Temas fechados" passa a usar o denominador certo — com 8 competências
  pedidas, "8 de 8".
- **Retirar um tema não apaga resposta nenhuma.** O que já foi respondido continua guardado e volta
  a contar se a empresa reincluir o tema. Convite já respondido não muda de conteúdo: o bloco é
  calculado na abertura do link.
- **O custo é da vaga reaberta, nunca de quem saiu.** A unidade de conta é a posição que voltou ao
  Empregare. Em nenhum lugar uma demissão identificável vira linha de despesa.
- **Nenhuma parcela é apresentada como fato.** Não há estatística de mercado nem "segundo estudos":
  os valores padrão são estimativas do IEL para uma vaga operacional, ditas como tais na tela, e
  existem para a analista trocar pelo número que a empresa der na ligação. O resultado é sempre "com
  estas parcelas, dá X".
- **A economia é projeção, não promessa.** Depende de uma hipótese de ganho de permanência que quem
  está ligando escolhe. O Mind RH não garante redução de rotatividade.
- **Recorte mínimo (`MIN_RECORTE`).** A taxa "a cada 100 vagas" só aparece com 5 vagas ou mais no
  período, e a permanência em 90 dias da empresa só com 5 contratados apurados — abaixo disso a tela
  diz "base pequena" / "ainda não dá para dizer".
- **Ausência é estado, nunca zero.** Empresa sem reabertura registrada nos últimos 12 meses (a
  maioria: o histórico cobre 41 das 2.500) não recebe média de consolo. O total do ano some, a tela
  explica por quê e sobra o custo por vaga, que já basta para a conversa.

## Ligações

Vem de: [Empresas](09-empresas.md), [Painel da empresa](02-painel-da-empresa.md).
Dispara: [Consulta ao colaborador](18-consulta-ao-colaborador.md).
Contém: [Mapa de Cultura](15-mapa-de-cultura.md), que é uma aba desta tela.
Alimenta: [Perfil do talento](08-perfil-do-talento.md), [Mesa de seleção](04-mesa-de-selecao.md).

## Histórico

- 2026-09-19 — criada.
- 2026-09-19 — registra a amostra de colaboradores e o convite por link (M2), que a interface Mind RH
  trouxe e o documento não mencionava.
- 2026-09-19 — entra a aba "Custo de reabrir" (S5): o argumento de adesão, com parcelas editáveis
  marcadas como estimativa, o contrafactual declarado como hipótese e a frase para ler ao telefone.
- 2026-09-19 — entra a aba "Mapa de cultura", que era tela solta no menu lateral. A tela passa a
  aceitar `?aba=` para abrir direto numa aba, que é como o link legado do mapa e o botão da mesa de
  seleção chegam aqui.
- 2026-09-20 — a tabela "Como a empresa trabalha" ganha a coluna **Equipe** (uniforme / variada /
  dividida), a variação das respostas por tema, com o piso de respostas respeitado.
- 2026-09-20 — a empresa passa a escolher **de 3 a 11 competências** (R11, pedido do IEL): o bloco
  "O que a empresa quer medir" na aba de cultura, o mesmo passo no formulário de convite, a linha
  "Competências escolhidas: 8 de 11" no cabeçalho e "A empresa não pediu esta competência" no lugar
  do número dos temas de fora.

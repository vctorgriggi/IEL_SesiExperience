# Princípios de interface — Central de Seleção IEL

Quem usa o sistema é a analista do Centro de Empregos, que hoje monta ranking no Excel; o RH ou a gestão de uma indústria, que responde um questionário de 5 minutos; e um candidato operacional, com baixo letramento digital, no celular. **Nenhum deles é analista de dados.** Cada tela é julgada por uma pergunta: uma pessoa leiga entende o que está vendo e o que fazer em 5 segundos?

Este documento é a referência de design do protótipo. Ele tem precedência sobre gosto pessoal e sobre o que já está implementado.

## 1. Uma pergunta por tela

Cada tela responde **uma** pergunta, tem **um** número principal e **uma** ação principal. Tudo o mais é apoio e fica visualmente abaixo.

| Tela | Pergunta que responde | Número principal | Ação principal |
| --- | --- | --- | --- |
| Visão geral | O que precisa de mim hoje? | pendências | abrir a vaga mais urgente |
| Vaga (mesa) | Quem eu envio para esta vaga? | compatíveis (≥ 35%) | marcar até 5 para enviar |
| Pessoa na vaga | Esta pessoa combina com esta empresa? | % de aderência | adicionar à lista / perguntar |
| Empresa | Como se trabalha nesta empresa? | respostas recebidas de N | cobrar quem falta / confirmar sugestão |
| Questionário (candidato) | Como você prefere trabalhar? | passo X de 5 | próxima |
| Questionário (colaborador) | Como é trabalhar aqui? | passo X de 5 | próxima |
| Importar planilha | Entrou tudo certo? | registros novos | confirmar importação |

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

| Evitar (jargão) | Usar |
| --- | --- |
| aderência | **combina com a empresa** (o % continua, a palavra muda) |
| eixo / eixos de fit | **ponto do dia a dia** / "os 5 pontos" |
| traçado cultural | **como a empresa trabalha** |
| perfil não fecha | **faltam respostas** (N de M) |
| triagem por estado da análise | **filtrar** |
| coleta dirigida / esclarecimento | **perguntar à pessoa** |
| encaminhamento | **enviar currículo** |
| match técnico | **requisitos da vaga** (%) |
| divergência gestão × equipe | **gestão e equipe respondem diferente** |
| sem informação / sem base | **ainda não respondeu** |
| leitura assistida — determinística | **resumo** (com `?` explicando que não usa IA paga) |
| fontes de dados / proveniência | **de onde vem** |

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

- Nielsen, *10 Usability Heuristics* — visibilidade de estado, correspondência com o mundo real, reconhecimento em vez de memória, estética minimalista.
- Few, *Information Dashboard Design* — um painel comunica uma mensagem; decoração e redundância competem com ela.
- GOV.UK Design System, *Content design* — escreva para quem lê pior; frases de até 25 palavras; sem jargão.
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

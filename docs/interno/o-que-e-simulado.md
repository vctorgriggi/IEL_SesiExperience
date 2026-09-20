# O que é simulado — e como a tela fala disso

Registro interno. Criado em 20/09/2026, na varredura pedida pelo dono do produto: "coisas de
decisões faltantes, restrições, são documentação — de DOC. Não no sistema."

A regra: **a interface fala como produto, nunca como protótipo.** O que o Mind RH ainda não faz de
fato fica aqui, não na tela. A tela diz o que acontece no produto ("Perfis enviados à empresa.",
"Interesse registrado — a analista combina a entrevista com a empresa.") e nada além disso.

Termos que não podem aparecer em texto que chega à pessoa (tela, toast, evento do histórico, nome de
fonte, descrição de fixture): demonstração, protótipo, fictício, simulado, "nesta base", "em produção
seria", "não implementado", "fora do escopo", "limitação", número de regra "(R7)", "§", nome de doc,
schema, seed, mock, fixture, sintético, hackathon, MVP, TODO, placeholder, lorem. Comentário de código
pode usar o que quiser — é para desenvolvedor.

## O que ainda é simulado

| O que                                | Como funciona hoje                                                                                                                                            | O que a tela diz agora                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base de dados**                    | Fixtures em `features/iel-demo/fixtures/**`; empresas, vagas, pessoas e experiências anteriores são inventadas. O banco guarda só o delta sobre essa base.    | Nada. Nomes de empresa anteriores no currículo saíram sem o sufixo "(fictícia)".                                                                                 |
| **Integração com o Empregare**       | Não existe conector. A fonte "Empregare" é uma lista fixa; "Aplicar atualização" em Integrações aplica um evento de sincronização gravado em `fixtures`.      | Fonte chama-se "Empregare"; descrição: "Vagas, candidaturas e experiências declaradas no currículo, recebidas do sistema de recrutamento do IEL."               |
| **Avaliação externa**                | Um único registro fixo (Ana), de um inventário inventado.                                                                                                     | Fonte "Avaliação externa"; o registro é "Inventário de preferências de trabalho — avaliação externa".                                                            |
| **Fonte indisponível**               | A analista marca a fonte como indisponível na tela de Integrações; não há monitoramento real.                                                                 | Evento do histórico: ator "Mind RH", ação "Fonte indisponível" / "Fonte restabelecida".                                                                         |
| **Envio de pergunta (esclarecimento)** | `send-clarification` só muda o estado; nenhum e-mail ou mensagem sai. A tela de quem recebe abre em Pendências.                                              | "Pergunta enviada." / "Solicitação registrada e enviada." / "A mensagem que chega a quem recebe fica em Pendências, na ação 'Abrir experiência do destinatário'." |
| **Resposta do destinatário**         | Aberta pela própria analista, na mesma sessão. A resposta preparada em fixture é revisável.                                                                   | Cartão "O que a pessoa recebe" → "Resposta registrada". Sem "nenhuma mensagem saiu deste ambiente".                                                             |
| **Encaminhamento à empresa**         | `register-referral` congela o retrato e grava o histórico. Nada vai para o sistema de origem nem por e-mail; a empresa abre o relatório pelo link `/relatorio/<token>`. | "Encaminhamento registrado. Perfis enviados à empresa." Histórico: "N perfis compartilhados com a empresa na vaga X."                                            |
| **"Quero entrevistar"**              | Registra a decisão e muda o estágio para "entrevista-empresa". Nenhuma reunião é marcada.                                                                     | "Interesse registrado — a analista combina a entrevista com a empresa." Histórico: "A empresa quer entrevistar a candidatura X. A analista combina a entrevista." |
| **Lembretes automáticos**            | Não saem sozinhos. A regra (24 h depois do envio, 24 h antes do prazo) está escrita, mas quem cobra é a analista, pelo botão "Mensagem do Mind".              | Só a regra do lembrete e o prazo. A linha "são simulados; em produção saem sozinhos" saiu.                                                                       |
| **Mensagem do Mind**                 | O texto é montado por regra e copiado para a área de transferência; a analista cola no WhatsApp do IEL. Não há envio.                                         | "Copiar" → "Mensagem copiada. Agora é colar no WhatsApp do IEL."                                                                                                 |
| **Histórico do BI (12 meses)**       | Gerado em `fixtures/outcomes.ts`; não é dado medido. A devolutiva de um toque das empresas é o que passa a substituir esse histórico por dado vivo.           | Faixa: "Histórico dos últimos 12 meses. O retorno de um toque das empresas passa a atualizar estes números." Ícone de histórico ao lado dos KPIs, com tooltip.   |
| **Texto do assistente**              | `deterministic-provider.ts` monta o texto por regra, sem modelo de linguagem, a partir dos registros marcados.                                                | "Texto montado só a partir dos registros selecionados."                                                                                                          |
| **Personas ("Ver como")**            | Troca de recorte de dados no menu do usuário; não é autenticação. O gestor da empresa, no produto, entra por link.                                             | Rodapé da barra mostra só o papel ("analista"). Toast: "Visão alterada." Avisos de escopo dizem "Esta empresa é de outra conta" / "O gestor só acessa…".        |
| **Reiniciar base**                   | Ação no menu do usuário; a equipe usa na apresentação. Volta a sala compartilhada ao delta vazio.                                                             | "Reiniciar base" → "Reiniciar a base? Volta a base para o estado inicial, para todo mundo que estiver usando. As respostas registradas desde então se perdem."   |
| **Login da equipe**                  | Senha única de equipe (`IEL_SENHA_ANALISTA`); sem conta por pessoa.                                                                                           | "Candidatos e empresas não entram por aqui: eles respondem pelo link que recebem, sem senha."                                                                    |
| **Prazos por regra do cliente**      | 2 dias candidato, 3 colaborador (R7), 15 devolutiva (R9), 30 "como está sendo".                                                                               | Só os prazos, sem o número da regra.                                                                                                                             |
| **Erro de tela**                     | `app/(iel)/error.tsx` — o estado no servidor não é perdido.                                                                                                   | "Algo falhou nesta tela" / "O que você registrou foi preservado."                                                                                                |

## O que continua na tela por ser fato de produto

- "Critério fora do escopo desta vaga." — é o rótulo do estado "Não se aplica", fala da vaga, não do
  produto.
- "Histórico dos últimos 12 meses" no BI e o ícone de histórico nos KPIs — a tela continua dizendo
  de onde vem cada número (vivo ou histórico), só não chama o histórico de "simulado".
- A regra de anonimato ("com 3 ou mais respostas, para ninguém ser identificado") e os limites do
  instrumento em `PRODUTO.md §11` são fato de produto quando ditos como fato; o "porque decidimos" não
  aparece.

## Como verificar

Varredura por Playwright (1440 e 390) em todas as telas da analista, lendo `document.body.innerText` e
procurando `demonstra|protótipo|prototipo|fictíc|simulad|\(R[0-9]|§|\.md|versão do texto|não
implementad|fora do escopo|nesta base|em produção` — tem de dar zero. Feita em 20/09/2026: zero
ocorrências, zero erro de console.

Atenção ao banco compartilhado: eventos do histórico gravados **antes** desta passada continuam com
os textos antigos ("Empregare — demonstração", "envio simulado") até alguém usar "Reiniciar base".

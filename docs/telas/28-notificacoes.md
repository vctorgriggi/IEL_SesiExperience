# Notificações

**Rota:** nenhuma — é o sino no cabeçalho, em todas as telas do analista
**Componente:** `apps/dashboard/components/iel-demo/layout/notificacoes-menu.tsx`, montado em
`layout/site-header.tsx`
**Regra:** `apps/dashboard/components/iel-demo/overview/pendencias.ts`
**Persona:** Analista IEL
**Última atualização:** 2026-09-20

## O que a tela faz

Responde "o que precisa de mim?" sem abrir o Início. O sino fica à esquerda do Tour, no mesmo canto
de todas as telas, com o número do que ainda não foi lido; o menu antecipa as seis primeiras
pendências, na mesma ordem de severidade da fila, e cada linha leva direto ao verbo que resolve.

As notificações **são** as pendências — não uma segunda lista com regra própria. Um aviso que não
existisse na fila seria um aviso sem lugar onde resolver.

## O que aparece

- **Sino** com pastilha vermelha e o número de não lidas (`9+` acima de nove).
- **Cabeçalho do menu**: "Notificações" e, quando há não lidas, **Marcar todas como lidas**.
- **Até seis linhas**, cada uma com: ponto colorido da prioridade (some quando lida), título em
  negrito se não lida, tipo e resumo, e o prazo colorido — vermelho para atraso, âmbar para alerta.
- **Rodapé**: "Ver a fila do dia", com `+N` quando há mais do que coube.
- Sem nada pendente, "Nada pendente agora."

## De onde vêm os dados hoje

`montarPendencias(state)`, a mesma função do cartão **Precisa de você hoje** no
[Início](01-visao-geral.md) e da aba do leque de [Ações rápidas](27-acoes-rapidas.md).

O que já foi lido fica no `localStorage` do navegador, na chave `mind-rh:notificacoes-lidas` — e
não no estado da demonstração, de propósito: "li" é de quem leu, não da base, e duas pessoas na
mesma sala não apagam o aviso uma da outra. Armazenamento bloqueado não quebra a barra; o aviso
volta na próxima carga, que é o lado seguro do erro.

A leitura só entra depois de montar (`hidratado`), para o servidor não divergir do cliente.

## Ações do usuário

| Ação                    | O que acontece                               |
| ----------------------- | -------------------------------------------- |
| Abrir o sino            | mostra as seis primeiras                     |
| Clicar numa linha       | marca aquela como lida e navega para o verbo |
| Marcar todas como lidas | zera a pastilha, sem tocar na fila           |
| Ver a fila do dia       | vai para o Início                            |

Nenhuma ação do reducer é disparada: ler um aviso não resolve a pendência, e a pastilha não é
progresso de trabalho.

## Backend futuro

Quando a fila vier do servidor, o sino acompanha sem mudança. O que **precisa** mudar de lugar é o
"lido": ele é por pessoa, não por navegador, e o destino é o perfil dela no servidor — hoje quem
troca de máquina reencontra tudo como não lido.

## Regras e limites

- **Só a analista o vê.** O gestor entra pela mesma casca, mas a fila é do trabalho do IEL e leva a
  telas que não são dele (PRODUTO.md §5).
- **A cor nunca é o único canal**: o prazo vem escrito ao lado do vermelho ou do âmbar, e a linha
  não lida traz "(não lida)" para leitor de tela.
- **O sino não inventa aviso.** Se não está na fila, não vira notificação.

## Ligações

Alcançável de qualquer tela do analista, ao lado do [Tour guiado](26-tour-guiado.md) e do leque de
[Ações rápidas](27-acoes-rapidas.md). Leva para o [Início](01-visao-geral.md) e para o verbo de
cada pendência.

## Em aberto

O mesmo contador aparece no sino e no botão de [Ações rápidas](27-acoes-rapidas.md), na mesma
dobra. Um dos dois deve sair; a decisão não foi tomada.

## Histórico

- 2026-09-20 — criada.

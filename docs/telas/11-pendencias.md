# Pendências

**Rota:** `/pendencias`
**Componente:** `apps/dashboard/components/iel-demo/clarifications/clarifications-screen.tsx`
**Persona:** Analista IEL (o gestor vê as perguntas dirigidas à própria equipe)
**Última atualização:** 2026-09-19

## O que a tela faz

Concentra as perguntas em aberto: o que o IEL precisa esclarecer com um talento ou com um gestor
antes de seguir. Cada pendência nasce ligada a um critério de uma vaga, e é isso que impede a
pergunta genérica que não muda análise nenhuma.

## O que aparece

- **Cabeçalho**: "O envio é simulado: a experiência do destinatário abre aqui mesmo."
- **Filtros por estado** da solicitação, com estado vazio próprio.
- **Lista de solicitações** — destinatário, vaga, critério, texto da pergunta, data e situação.
- **Diálogo de incorporação** (`incorporate-clarification-dialog.tsx`) — quando a resposta chega, é
  aqui que ela entra na análise, com o efeito visível antes de confirmar.

## De onde vêm os dados hoje

`getOpenClarifications` e demais seletores de esclarecimento sobre `state.clarifications`.

## Ações do usuário

- Criar solicitação (a partir de um critério, em outras telas).
- Enviar — `send-clarification` (simulado).
- Cancelar — `cancel-clarification`.
- Incorporar a resposta na análise — `incorporate-clarification`.

## Backend futuro

- Envio real por e-mail ou mensagem, com link assinado e prazo de validade.
- Estado da solicitação passa a ter ciclo de vida persistido (criada, enviada, respondida,
  incorporada, cancelada) e lembrete automático.
- A resposta recebida vira evidência com natureza própria (`resposta-de-esclarecimento`), ligada ao
  critério que a originou.

## Regras e limites

- A pergunta é dirigida ao critério: a tela não coleta informação "por via das dúvidas".
- Incorporar é ato humano. A resposta não altera a análise sozinha.

## Ligações

Vem de: [Mesa de seleção](04-mesa-de-selecao.md), [Comparação](05-comparacao.md),
[Perfil do talento](08-perfil-do-talento.md).
Entra em: [Resposta do destinatário](12-resposta-do-destinatario.md).

## Histórico

- 2026-09-19 — criada.

# Resposta do destinatário

**Rota:** `/iel/pendencias/[clarificationId]/responder`
**Componente:** `apps/dashboard/components/iel-demo/clarifications/recipient-experience-screen.tsx`
**Persona:** A pessoa ou o gestor que recebeu a pergunta
**Última atualização:** 2026-09-19

## O que a tela faz

É a tela que a pessoa do outro lado veria ao receber a pergunta. Mostra o que foi perguntado, por
que foi perguntado e — no caso do talento — quais registros o IEL já tem sobre ela. Responder aqui
devolve a informação para a análise.

## O que aparece

- **Cabeçalho da pergunta**, com a vaga e o critério que a motivou.
- **Campo de resposta** (`#recipient-answer`) e botão de confirmação.
- **Transparência ao candidato** (`clarifications/talent-transparency.tsx`) — os registros que
  existem sobre a pessoa, com procedência, ocultando o que é uso interno do IEL.
- **Confirmação** — "Resposta registrada", depois do envio.

## De onde vêm os dados hoje

`getTalentTransparency` e os seletores de esclarecimento.

## Ações do usuário

- Responder — `answer-clarification`.

## Backend futuro

- Acesso por link assinado com validade, sem exigir conta: o destinatário não é usuário do sistema.
- A resposta é gravada com data, origem do acesso e texto integral, e vira evidência ligada ao
  critério.
- Direitos do titular (acesso, correção, oposição) ganham fluxo próprio a partir desta tela, que já
  é o ponto em que a pessoa vê o que existe sobre ela.

## Regras e limites

- A pessoa vê a procedência dos próprios dados. Avaliação interna do IEL não aparece.
- A tela precisa funcionar em largura de celular e por teclado — há teste de ponta a ponta cobrindo
  exatamente isso.
- Nada é enviado de verdade na demonstração.

## Ligações

Vem de: [Pendências](11-pendencias.md).

## Histórico

- 2026-09-19 — criada.

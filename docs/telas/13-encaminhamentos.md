# Encaminhamentos

**Rota:** `/iel/encaminhamentos`
**Componente:** `ReferralsScreen`, em
`apps/dashboard/components/iel-demo/referrals/referrals-screens.tsx`
**Persona:** Analista IEL e gestor (cada um vê o seu recorte)
**Última atualização:** 2026-09-19

## O que a tela faz

Lista os encaminhamentos registrados. Cada registro guarda um retrato das informações no momento em
que foi feito — é o que permite explicar depois o que a empresa recebeu, mesmo que o perfil tenha
mudado desde então.

## O que aparece

- **Cabeçalho**: "Cada registro guarda um retrato das informações no momento do encaminhamento."
- **Lista de encaminhamentos** com empresa, vaga, data, quantidade de perfis e situação.
- **Coluna "O que aconteceu"** — quantos desfechos a empresa já informou, quantas contratações e
  quantas pessoas seguem sem resposta, com há quantos dias. Responde de relance a pergunta que traz
  a analista aqui depois do envio: de qual empresa eu ainda preciso cobrar? É a leitura viva de C3.
- **Estado vazio** próprio quando não há registro.

- **Link do relatório para a empresa** (`referrals/report-link.tsx`) — aparece depois que o
  encaminhamento é registrado, porque é o registro que cria o que a empresa vai abrir. O link é **por
  vaga**, não por pessoa: a empresa recebe uma remessa, e é a remessa que a página mostra. Leva para
  [Relatório para a empresa](20-relatorio-para-a-empresa.md).

## De onde vêm os dados hoje

`getRegisteredReferrals` e `getReferralsByCompany` sobre `state.referrals`;
`getReferralOutcomeSummary` para a coluna de desfecho.

## Ações do usuário

- Abrir o detalhe de um encaminhamento.

## Backend futuro

- Encaminhamento vira entidade persistida com versão imutável do que foi compartilhado.
- Entra prazo de retenção e expiração de acesso da empresa ao material compartilhado.

## Regras e limites

- O recorte por empresa é obrigatório: o gestor vê apenas os encaminhamentos feitos para a empresa
  dele.

## Ligações

Vem de: [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md).
Entra em: [Detalhe do encaminhamento](14-detalhe-do-encaminhamento.md).

## Histórico

- 2026-09-19 — criada.
- 2026-09-19 — registra o link do relatório para a empresa (S3), gerado após o encaminhamento.
- 2026-09-19 — ganha a coluna "O que aconteceu", com o desfecho capturado pela devolutiva de um
  clique (C3).

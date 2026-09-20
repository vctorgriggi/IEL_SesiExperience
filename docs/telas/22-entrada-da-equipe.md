# Entrada da equipe

**Rota:** `/iel/entrar`
**Componentes:** `apps/dashboard/app/(iel)/iel/entrar/{page.tsx,entrar-form.tsx,actions.ts}`
**Regra:** `apps/dashboard/features/iel-demo/acesso/sessao.ts`
**Persona:** equipe do IEL (analista)
**Última atualização:** 2026-09-19

## O que a tela faz

É a porta da Central de Seleção. Só a equipe do IEL entra por aqui; candidato, colaborador e empresa
chegam por link e nunca veem esta tela. Ela existe para que a demonstração publicada na internet não
fique aberta a qualquer pessoa que descubra a URL.

## O que aparece

- **A assinatura da marca** (Mind RH, uma solução Madvic), centrada, sobre o marfim do tema.
- **Um cartão** com o título "Central de Seleção", a linha "Acesso da equipe do IEL · Centro de
  Empregos da Indústria", o campo **Senha da equipe** e o botão **Entrar**.
- **O erro abaixo do campo**, em vermelho e com `role="alert"`, quando a senha não confere.
- **Um rodapé** dizendo que candidatos e empresas entram pelo link que recebem, sem senha, e que a
  base é fictícia.

A casca do analista (barra lateral, cabeçalho, Mind) não desenha aqui: quem ainda não entrou não tem
navegação. O VLibras continua, porque a acessibilidade começa na porta.

## De onde vêm os dados hoje

Nenhum dado do domínio. A tela lê apenas duas coisas do servidor:

- `acessoExigeSenha()` — há `IEL_SENHA_ANALISTA` definida?
- `temSessaoDaAnalista()` — o cookie `iel-acesso` é válido?

Sem a variável definida, a porta fica aberta e `/iel/entrar` redireciona para `/iel`. É assim que o
protótipo roda na máquina de quem desenvolve, sem configurar nada.

## Ações do usuário

- **Entrar** — Server Action `entrar`, que compara a senha e grava o cookie assinado.
- **Sair da Central** — Server Action `sair`, no menu da persona, no pé da barra lateral. Só aparece
  quando a porta exige senha.

## Como a sessão funciona hoje

O cookie `iel-acesso` guarda `prazo.assinatura`, com HMAC-SHA256 do prazo usando `AUTH_SECRET`. Vale
**8 horas** — um turno, não uma sessão eterna. É `httpOnly`, `sameSite=lax` e `secure` em produção.
Não guarda nome, e-mail nem nada da pessoa: só diz "esta sessão vale até tal hora", e não pode ser
forjado nem esticado pelo navegador.

O portão fica no layout do grupo `(iel)`, que lê o caminho do cabeçalho `x-pathname` carimbado pelo
middleware. Rotas abertas, derivadas de `@workspace/routes`: a própria entrada, o questionário do
candidato, a consulta ao colaborador e o relatório da empresa.

## Backend futuro

Vira o `@workspace/auth` do kit (Auth.js), com conta por pessoa, e-mail, senha e sessão em banco —
mais MFA e registro de acesso, que uma central que trata dado de candidato precisa ter. As telas não
mudam: o que elas conhecem é `temSessaoDaAnalista()`, e é só essa função que troca de dentro. Com
contas de verdade, a persona do menu deixa de ser um seletor de visão e passa a ser quem está
logado.

## Regras e limites

- **Uma senha de equipe não é autenticação.** Não identifica quem entrou e não serve para produção;
  é a trava mínima de uma demonstração publicada.
- **Nenhum papel de fora ganhou login.** Empresa, colaborador e candidato seguem entrando por
  link, sem cadastro — o "login e área logada para a empresa" é Won't do MoSCoW, por risco de não
  adesão, e o candidato operacional trava em plataforma (00:08:01, 00:23:28).
- **Comparação simples de senha.** Em produção isso é `timingSafeEqual` mais limite de tentativas.

## Ligações

Leva a: [Visão geral](01-visao-geral.md). Deixa passar sem senha:
[Questionário do candidato](17-questionario-do-candidato.md),
[Consulta ao colaborador](18-consulta-ao-colaborador.md) e
[Relatório para a empresa](20-relatorio-para-a-empresa.md).

## Histórico

- 2026-09-19 — criada junto com a porta da Central.

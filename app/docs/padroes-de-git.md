# Padrões de Git

Como nomear branch, escrever commit e abrir PR neste repositório.

`main` é a branch protegida e sempre deployável. Nada entra nela sem PR.

## 1. Branch

Formato:

```text
<tipo>/<descricao-curta>
```

- `tipo` vem da mesma lista de tipos de commit (seção 2).
- `descricao-curta` em português, `kebab-case`, 2 a 4 palavras.
- Sem acento, sem `ç`, sem número de issue solto.
- Quando houver issue, use `<tipo>/<numero>-<descricao>`.

```text
feat/matriz-de-fit
fix/calculo-fit-vaga-vazia
refactor/feature-encaminhamentos
docs/boas-praticas
chore/atualiza-drizzle
feat/42-exportar-encaminhamento
```

Evite: `minha-branch`, `teste`, `michell`, `fix`, `feature/NovaTela`.

### Ciclo de vida

- Sempre saia de `main` atualizada: `git switch main && git pull && git switch -c feat/minha-branch`.
- Uma branch resolve um assunto. Assunto novo, branch nova.
- Para atualizar com `main` durante o trabalho, use `git rebase main` enquanto a branch for sua e não estiver compartilhada. Se outra pessoa já baixou a branch, use `git merge main`.
- Branch merjada é apagada. Não acumule branch morta no remoto.

## 2. Commit

Adotamos **Conventional Commits**.

```text
<tipo>(<escopo>): <descrição>

<corpo opcional>

<rodapé opcional>
```

- `tipo` em inglês, vocabulário fixo (é lido por ferramenta).
- `escopo` opcional, é a área tocada: `dashboard`, `iel`, `database`, `auth`, `ui`, `docs`, `ci`.
- `descrição` em português, imperativo, minúscula inicial, sem ponto final, até 72 caracteres.

### Tipos

| Tipo       | Quando usar                            |
| ---------- | -------------------------------------- |
| `feat`     | Funcionalidade nova para o usuário     |
| `fix`      | Correção de bug                        |
| `refactor` | Muda estrutura sem mudar comportamento |
| `perf`     | Melhora desempenho                     |
| `docs`     | Só documentação                        |
| `test`     | Adiciona ou corrige teste              |
| `style`    | Só formatação, sem efeito em runtime   |
| `build`    | Dependência, bundler, Docker           |
| `ci`       | Workflow do GitHub Actions             |
| `chore`    | Manutenção que não encaixa acima       |
| `revert`   | Desfaz um commit anterior              |

### Exemplos

```text
feat(iel): adiciona matriz de compatibilidade talento-vaga
fix(iel): retorna fit zero quando a vaga nao tem competencias
refactor(dashboard): move leitura de encaminhamentos para features/data
docs: cria guia de boas praticas de codigo
test(iel): cobre calculo de fit com lista vazia
chore(deps): sobe drizzle-orm para 0.45.2
```

### Regras

- Um commit por mudança lógica. Não misture correção com refatoração.
- A descrição diz o **efeito**, não o arquivo mexido. `fix(auth): impede login com sessao expirada`, não `fix: altera get-auth-context.ts`.
- Corpo explica **por quê**, quando o motivo não é óbvio. Separe do título por linha em branco, quebre em 72 colunas.
- Referencie issue no rodapé: `Closes #42`.
- Breaking change: `!` depois do escopo e rodapé `BREAKING CHANGE: <o que quebrou>`.

```text
feat(database)!: renomeia tabela referrals para encaminhamentos

O nome antigo nao batia com o dominio usado no restante do produto
e gerava confusao na leitura das queries.

BREAKING CHANGE: consultas diretas a `referrals` param de funcionar.
Closes #58
```

### Proibido

- `wip`, `ajustes`, `.`, `update`, `correções`
- Commit que só roda o formatador junto com mudança de lógica
- Commit que quebra o build. Se quebrou, corrija antes de subir.

## 3. Pull Request

### Título

Mesma regra do commit: `<tipo>(<escopo>): <descrição>`. O título do PR vira a mensagem do squash.

### Descrição

Use o template em `.github/pull_request_template.md`. Ele pede:

- **O que muda** — resumo em 2 ou 3 linhas
- **Por quê** — problema resolvido ou issue referenciada
- **Como testar** — passo a passo reproduzível
- **Checklist** — os itens do `docs/repo-definition-of-done.md`

### Tamanho

- Alvo: até 400 linhas de diff.
- Acima disso, quebre em PRs encadeados. PR grande não é revisado, é aprovado no escuro.
- Renomeação em massa e formatação vão em PR próprio, separado de mudança de lógica.

### Antes de pedir review

- `bun run lint` e `bun run typecheck` limpos
- `bun run test` passando
- Sem `console.log`, sem código comentado, sem import morto
- Auto-review do próprio diff feito

### CI

O workflow `PR CI` roda em todo pull request: `lint`, `typecheck`, `build`, `test`, `test:coverage` e o E2E do dashboard. PR com check vermelho não é revisado.

### Review

- Mínimo 1 aprovação para merjar.
- Comentário de review é sobre o código, nunca sobre a pessoa.
- Sugestão opcional é marcada como `nit:`.
- Quem abriu o PR resolve as conversas; quem revisou confirma.

### Merge

- **Squash and merge** é o padrão. `main` fica com um commit por PR.
- Revise a mensagem do squash antes de confirmar: o GitHub concatena os commits da branch.
- Merge commit só para integração de branch longa de release.
- Apague a branch após o merge.

# Boas Práticas de Código

Regras de escrita de código para este repositório. Complementa `docs/repo-definition-of-done.md`, que trata do que validar antes de entregar.

Quando uma regra daqui conflitar com o código existente, vale esta doc e o arquivo antigo é ajustado no PR seguinte.

## 1. Princípios

- Código é lido muito mais vezes do que é escrito. Otimize para leitura.
- Clareza vence esperteza. Não existe prêmio por linha curta.
- Uma unidade de código faz uma coisa. Se o nome precisa de "e", são duas.
- Delete em vez de comentar. O histórico está no Git.
- Não abstraia na primeira repetição. Abstraia na terceira, quando o padrão já apareceu.
- Não crie camada que só repassa argumento adiante.

## 2. Comentários

**A regra padrão é não escrever comentários.** Um comentário quase sempre indica que o código não se explica sozinho — corrija o código.

Em vez de comentar:

- extraia a expressão para uma constante ou função com nome descritivo;
- renomeie a variável;
- quebre a função em partes menores.

Exceções permitidas, sempre em português e sempre explicando **por quê**, nunca **o quê**:

- decisão contraintuitiva que alguém desfaria por engano (ex.: um `ignores` no ESLint por causa de arquivo gerado);
- workaround de bug de biblioteca, com link para a issue;
- regra de negócio que não se deduz do código.

Proibidos: comentário que narra a linha seguinte, cabeçalho decorativo, código comentado, `TODO` sem dono nem issue.

Errado, precisa de comentário para se explicar:

```ts
const d = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
```

Certo, o nome carrega a explicação:

```ts
const SETE_DIAS_EM_MS = 1000 * 60 * 60 * 24 * 7;
const expiraEm = new Date(Date.now() + SETE_DIAS_EM_MS);
```

## 3. Nomes

### Idioma

**Português em tudo.** Nome de variável, função, tipo, arquivo, pasta, componente, tabela e coluna. Misturar os dois idiomas no mesmo identificador é o pior dos casos.

Errado, os dois idiomas no mesmo identificador:

```ts
export function calcularFit(talent: Talent): number {}
export function getVagas(): Job[] {}
const listaDeJobs = [];
```

Certo:

```ts
export function calcularFit(talento: Talento): number {}
export function buscarVagas(): Vaga[] {}
const vagas = [];
```

**Sem acento e sem cedilha no identificador.** O texto na tela leva acento; o nome no código, não.

```ts
const competencias = [];
const pendenciasEmAberto = 0;
type OrgaoEmissor = { sigla: string };
```

Exceções, porque são vocabulário fixo de ferramenta e não nosso:

- palavra-chave e API da linguagem, do React e do Next: `useState`, `page.tsx`, `layout.tsx`, `route.ts`, `getServerSideProps`;
- nome vindo de biblioteca ou de integração externa: `stripeCustomerId`, `webhook`, `slug`, `token`;
- termo técnico sem tradução corrente: `cache`, `commit`, `deploy`, `hash`, `middleware`, `id`.

Na dúvida entre traduzir e manter: se a palavra aparece na conversa do time em português, traduza.

Glossário do domínio IEL, para ninguém inventar sinônimo próprio:

| Termo           | Use              | Não use                   |
| --------------- | ---------------- | ------------------------- |
| talento         | `talento`        | `candidato`, `pessoa`     |
| vaga            | `vaga`           | `posicao`, `oportunidade` |
| competência     | `competencia`    | `habilidade`, `skill`     |
| encaminhamento  | `encaminhamento` | `indicacao`, `referral`   |
| empresa         | `empresa`        | `cliente`, `organizacao`  |
| pendência       | `pendencia`      | `duvida`, `clarification` |
| fonte de dados  | `fonteDeDados`   | `origem`, `dataSource`    |
| compatibilidade | `fit`            | `match`, `aderencia`      |

`fit` fica em inglês porque é o termo que o próprio negócio usa, inclusive na tela.

### Formato

- Arquivos e pastas em `kebab-case`.
- Leitura server-side: o arquivo em `kebab-case` exporta a mesma palavra em `camelCase` — `buscar-status-totp.ts` exporta `buscarStatusTotp()`.
- Actions: verbo no infinitivo — `criar-vaga.ts`, `atualizar-perfil.ts`.
- Hooks: `use-<nome>.ts`. O prefixo `use` é exigência do React, o resto do nome é português — `use-filtros-de-vaga.ts`.
- Schemas Zod: `<nome>-schema.ts`.
- Tipos e componentes em `PascalCase`; constante de módulo em `SCREAMING_SNAKE_CASE`.
- Booleanos começam com `esta`, `tem`, `pode` ou `deve` — `estaAtivo`, `temPermissao`, `podeEditar`.
- Nada de abreviação inventada. `organizacao`, não `org`, exceto onde já é convenção do repo (`slug`).

## 4. Funções

- Uma função deve caber na tela sem rolar.
- Máximo de 3 parâmetros posicionais. Acima disso, receba um objeto.
- Evite parâmetro booleano que troca o comportamento da função. Escreva duas funções.
- Retorne cedo. Evite `else` depois de `return`.
- Sem efeito colateral escondido: uma função chamada `buscarX` não pode gravar no banco.

```ts
export function calcularFit(talento: Talento, vaga: Vaga): number {
  if (!talento.competencias.length) return 0;
  if (!vaga.competencias.length) return 0;

  const competenciasAtendidas = vaga.competencias.filter((competencia) =>
    talento.competencias.includes(competencia)
  );

  return competenciasAtendidas.length / vaga.competencias.length;
}
```

## 5. TypeScript

- `strict` ligado. `any` é proibido; use `unknown` e estreite o tipo.
- Prefira `type` a `interface`.
- Não use type assertion (`as`) para calar o compilador. Se precisou, valide com Zod antes.
- Exportações nomeadas. `export default` só onde o framework exige (páginas, layouts, `route.ts`).
- Tipos de domínio ficam perto do dono: `features/<nome>/types.ts` ou junto do schema.
- Derive tipos do Zod com `z.infer` em vez de declarar duas vezes.
- Nada de enum do TypeScript; use union de string literal.

## 6. React e Next.js

- Server Component é o padrão. `'use client'` só quando houver estado, evento, ou API de browser.
- Empurre o `'use client'` para a folha da árvore. Não marque a página inteira por causa de um botão.
- Leitura inicial de dados acontece na RSC, não em `useEffect` nem `useQuery`.
- Componente com mais de uma responsabilidade visual vira dois componentes.
- Nada de `useEffect` para derivar estado a partir de props: calcule durante o render.
- Chave de lista é id estável, nunca índice.
- Importe do root de `@workspace/ui`, sem subpath.
- Caminhos vêm de `@workspace/routes` (`routes.*`, `api.*`). String de rota hardcoded é bug esperando acontecer.

## 7. Organização por feature

Um arquivo, uma competência. Se você não consegue dizer em uma frase o que um arquivo faz, ele faz demais.

### Tamanho de arquivo

- **Alvo: 200 linhas. Limite: 300.**
- Passou de 300, quebre antes de abrir o PR. Não é sugestão.
- Tamanho é sintoma, não a doença: um arquivo estoura porque acumulou competência. Separe por responsabilidade, não corte no meio para caber.
- Isento: fixture e massa de dados, arquivo gerado (migração do Drizzle, `next-env.d.ts`), snapshot de teste.
- Quando a quebra não for óbvia, extraia nesta ordem: schema, depois tipos, depois subcomponente de apresentação, depois hook de estado.

Hoje 23 dos 416 arquivos do dashboard passam de 300 linhas, quase todos no protótipo IEL. Arquivo legado só precisa ser dividido quando alguém for mexer nele.

### Onde cada coisa mora

```text
app/(protected)/.../vagas/[vagaId]/
  page.tsx                          rota: busca o dado e compõe a tela
  layout.tsx                        auth e moldura compartilhada
  loading.tsx  error.tsx            estados da rota

features/vagas/
  data/buscar-vaga-por-id.ts        leitura server-only
  actions/atualizar-vaga.ts         mutação
  schemas/atualizar-vaga-schema.ts  contrato de dados
  use-filtros-de-vaga.ts            estado de UI só do browser
  types.ts                          tipos do domínio

components/vagas/
  vaga-formulario.tsx               formulário
  vaga-lista.tsx                    lista
  vaga-card.tsx                     item
  vaga-status-selo.tsx              apresentação pura
```

### Competência de cada arquivo

| Arquivo                 | Faz                                                           | Não faz                                                |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| `page.tsx`              | Chama `buscar-*`, monta o layout da tela, passa props         | Regra de negócio, query direta, `'use client'`, estado |
| `layout.tsx`            | Autenticação, contexto de organização, moldura                | Buscar dado de uma tela específica                     |
| `data/buscar-*.ts`      | Uma leitura, com select explícito e auth context              | Escrever no banco, formatar texto para a UI            |
| `actions/*.ts`          | Uma mutação, valida entrada, revalida rota                    | Ler dado para renderizar, montar JSX                   |
| `schemas/*.ts`          | Define e valida a forma do dado, exporta o tipo via `z.infer` | Acessar banco, importar componente                     |
| `types.ts`              | Tipo de domínio compartilhado pela feature                    | Tipo usado por um único arquivo                        |
| `use-<nome>.ts`         | Estado de browser, submit, toast, `router.refresh()`          | Buscar dado que a RSC já poderia ter trazido           |
| `<nome>-formulario.tsx` | Liga schema, `useZodForm` e action; exibe erro de campo       | Declarar o próprio schema, chamar banco, decidir rota  |
| `<nome>-lista.tsx`      | Itera e delega para o item                                    | Filtrar, ordenar ou buscar — receba pronto             |
| `<nome>-card.tsx`       | Renderiza um item a partir de props                           | Conhecer a action, o banco ou a rota                   |
| `lib/*.ts`              | Utilitário genérico sem domínio                               | Conhecer `talento`, `vaga` ou qualquer regra do IEL    |
| `@workspace/ui`         | Primitivo visual reutilizável                                 | Conhecer qualquer domínio do produto                   |

### Direção da dependência

```text
page.tsx  →  components/  →  features/{schemas,types}
    ↓                              ↑
features/data  features/actions ───┘
```

- `page.tsx` importa de `data/` e de `components/`.
- `components/` importa de `actions/`, `schemas/` e `types.ts`. Nunca de `data/`.
- `data/` e `actions/` nunca importam componente.
- `schemas/` e `types.ts` não importam nada do app: são as folhas da árvore.
- Arquivo com `import 'server-only'` não pode ser alcançado por um componente `'use client'`.

### Schema: um só, no lugar certo

O schema mora em `features/<nome>/schemas/`. Formulário importa, não redeclara.

Quando o formulário tem campo que o servidor não recebe — confirmação de senha, aceite de termo — são dois arquivos, e o de formulário estende o de action:

```text
schemas/alterar-senha-action-schema.ts   verdade do servidor
schemas/alterar-senha-schema.ts          estende com confirmarSenha e o refine
```

Nunca duplique a regra nos dois. O de formulário sempre parte do de action.

### Quando quebrar um componente

Quebre quando qualquer uma for verdade:

- passa das 200 linhas de alvo;
- o nome precisa de "e" para descrever o que ele faz;
- uma parte precisa de `'use client'` e o resto não;
- um pedaço aparece em outra tela;
- tem dois `useState` que não conversam entre si.

Não quebre só para diminuir arquivo: componente que só existe para ser usado uma vez, por um pai, e não tem estado próprio, pode continuar no mesmo arquivo.

### Regras de fronteira

- `data/` começa com `import 'server-only'` e faz select explícito.
- `actions/` usa `authActionClient` ou `authOrganizationActionClient`, valida com `inputSchema` e chama `revalidatePath` no fim.
- Criar rota `GET` em `app/api/` só quando o browser ou um consumidor externo precisar do dado. RSC lê direto do banco.
- Autenticação mora em server layout, não em middleware.
- Componente sobe um nível de pasta só quando um segundo consumidor aparece. Antes disso, fica na feature.

## 8. Validação e erros

- Zod em toda fronteira: formulário, action, route handler, variável de ambiente.
- Valide na entrada, uma vez. Depois disso confie no tipo.
- Não engula exceção. `catch` que só faz `console.log` é erro silencioso em produção.
- Mensagem de erro para o usuário: português, sem stack trace, sem nome de tabela.
- Erro esperado é retorno, não exceção. Exceção é para o que não deveria acontecer.

```ts
const validacao = schema.safeParse(entrada);
if (!validacao.success) {
  return { erro: 'Dados inválidos. Revise os campos destacados.' };
}
```

## 9. Banco de dados

- Sempre `select` explícito de colunas. Nunca traga a linha inteira por preguiça.
- Consulta dentro de laço é proibida. Busque em lote.
- Use `limit` em toda consulta que não é paginada por definição.
- Mudança de schema passa por `generate` e `migrate`; `push` só em desenvolvimento local.
- Migração não é editada depois de aplicada — crie outra.

## 10. Testes

- Teste comportamento observável, não implementação.
- `describe` nomeia o identificador sob teste: `describe('calcularFit')`.
- `it` descreve o caso começando por verbo, com acento normal: `it('retorna zero quando o talento não tem competências')`.
- Mocke na fronteira da integração (provedor de e-mail, storage, billing), nunca a lógica interna.
- Todo bug corrigido ganha um teste que falha antes da correção.
- Fluxo crítico do dashboard tem E2E em Playwright.

## 11. Formatação

Formatação não é assunto de code review — é responsabilidade da ferramenta.

- Prettier decide aspas, vírgula e quebra de linha. Config em `tools/prettier-config`.
- Ordem de import é automática. Não reordene à mão.
- `bun run lint:fix` e `bun run format:fix` antes de abrir PR.
- PR não passa com warning de ESLint: o lint roda com `--max-warnings=0`.

## 12. Commits e PR

Nome de branch, formato de commit e fluxo de PR estão em `docs/padroes-de-git.md`. O essencial:

- Commit segue Conventional Commits: `fix(iel): retorna fit zero quando a vaga nao tem competencias`.
- Um commit por mudança lógica. Não misture refatoração com correção.
- PR pequeno. Se passa de 400 linhas, provavelmente são dois PRs.
- Renomear arquivo e mudar conteúdo no mesmo commit destrói o diff — separe.

## 13. Checklist antes de abrir PR

- [ ] Nenhum comentário novo além das exceções da seção 2
- [ ] Identificadores em português, sem acento e sem mistura com inglês
- [ ] Nenhum arquivo novo acima de 300 linhas
- [ ] Schema no lugar certo, não redeclarado dentro do formulário
- [ ] Nenhum `any` e nenhum `as` novo
- [ ] Nenhuma string de rota hardcoded
- [ ] `'use client'` só onde é necessário
- [ ] Toda entrada validada com Zod
- [ ] `bun run lint` e `bun run typecheck` limpos
- [ ] Testes cobrindo o comportamento alterado
- [ ] Sem código morto, sem import não usado, sem `console.log`

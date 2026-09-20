/**
 * Declaração de importação de folha de estilo global.
 *
 * O `next-env.d.ts` puxa os tipos do Next, e o Next declara só
 * `*.module.css`, `*.module.sass` e `*.module.scss` — o CSS global importado
 * por efeito colateral (`import './iel-theme.css'`) não tem declaração
 * nenhuma. No TypeScript 5.8 isso passa em silêncio; do 6.0 em diante o
 * compilador acusa `TS2882` ("cannot find module or type declarations for
 * side-effect import"), e o editor, que costuma trazer um TypeScript mais
 * novo que o do repositório, já acusa hoje.
 *
 * A importação existe pelo efeito, não pelo valor: quem importa nunca lê o
 * que volta. Por isso o módulo é declarado sem exportação — assim
 * `import './arquivo.css'` é válido e `import x from './arquivo.css'` não
 * ganha um `any` de brinde.
 *
 * Não cobre `*.module.css`: aquele já vem tipado pelo Next, com o mapa de
 * classes, e redeclarar aqui apagaria a tipagem melhor.
 */
declare module '*.css';

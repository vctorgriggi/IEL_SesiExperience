/**
 * Substituto do pacote `server-only` durante os testes. Ele existe para o
 * bundler quebrar o build quando um módulo de servidor é importado no cliente;
 * nos testes não há essa fronteira, e importá-lo de verdade lança erro.
 */
export {};

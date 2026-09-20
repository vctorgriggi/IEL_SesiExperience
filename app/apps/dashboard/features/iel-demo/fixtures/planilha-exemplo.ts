/**
 * Planilha de exemplo da Empregare (M6).
 *
 * O arquivo canônico é `planilha-exemplo.csv`, ao lado deste módulo: é ele que
 * o analista baixa para ver o formato esperado, e é dele que este texto foi
 * copiado. A constante existe porque `?raw` não é suportado pelo bundler do
 * Next sem configuração extra, e o teste ao lado falha se os dois divergirem.
 *
 * O conteúdo exercita de propósito o que a exportação real traz: BOM do Excel
 * em Windows, separador `;`, quebra de linha `\r\n`, percentual com e sem `%`,
 * um campo entre aspas e duas linhas descartadas pelo filtro técnico com match
 * abaixo de 50 — que é o caso de resgate (R10, S2).
 */
const PLANILHA_EXEMPLO = `\u{FEFF}nome;email;telefone;cidade;vaga;match_tecnico;situacao\r\nAna Ribeiro;ana.ribeiro@example.com;(65) 99100-0001;Cuiabá, MT;Assistente de Logística;82%;Em análise\r\nBruno Costa;bruno.costa@example.com;(65) 99100-0002;Cuiabá, MT;Assistente de Logística;80;Em análise\r\nElisa Martins;elisa.martins@example.com;(65) 99100-0003;Várzea Grande, MT;Assistente de Logística;74%;Em análise\r\nFábio Lima;fabio.lima@example.com;(65) 99100-0004;Cuiabá, MT;Assistente de Logística;53;Em análise\r\nIara Souza;iara.souza@example.com;(65) 99100-0005;Cuiabá, MT;Assistente de Logística;68%;Em análise\r\nJoão Peixoto;joao.peixoto@example.com;(65) 99100-0006;Várzea Grande, MT;Assistente de Logística;59;Em análise\r\nLarissa Prado;larissa.prado@example.com;(65) 99100-0007;Cuiabá, MT;Assistente de Logística;47%;Descartado pelo filtro\r\nMarcos Vieira;marcos.vieira@example.com;(65) 99100-0008;Cuiabá, MT;Assistente de Logística;91;Em análise\r\nNatália Cruz;natalia.cruz@example.com;(65) 99100-0009;Santo Antônio de Leverger, MT;Assistente de Logística;38%;Descartado pelo filtro\r\nOtávio Ramos;otavio.ramos@example.com;(65) 99100-0010;Cuiabá, MT;Assistente de Logística;55;Em análise\r\nPriscila Antunes;priscila.antunes@example.com;(65) 99100-0011;"Nossa Senhora do Livramento, MT";Assistente de Logística;73%;Em análise\r\nRodrigo Bastos;rodrigo.bastos@example.com;(65) 99100-0012;Cuiabá, MT;Assistente de Logística;62;Em análise\r\n`;

/** O conteúdo da planilha de exemplo, como um arquivo enviado pelo analista. */
export function loadExampleSpreadsheet(): string {
  return PLANILHA_EXEMPLO;
}

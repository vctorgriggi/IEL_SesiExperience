# Entendimento do Desafio IEL: Fit Cultural na Triagem

> Transcrição do PDF `Entendimento do Desafio IEL Fit Cultural na Triagem.pdf`. Conteúdo preservado; formatação adaptada para Markdown.

## 1. Dor central do cliente

O Centro de Empregos da Indústria do IEL entrega currículos com aderência técnica, mas sem nenhuma leitura de comportamento e de cultura, e as indústrias seguem perdendo os contratados em poucas semanas. A frase que resume a dor veio da própria equipe do IEL na conversa de 19/09/2026: **contrata-se pelo currículo e demite-se pelo comportamento.**

- **O sintoma é o turnover que reabre a mesma vaga todo mês.** Uma indústria abre 30 vagas e no mês seguinte abre 30 de novo. Um frigorífico abre 700 e, no mês seguinte, 500. O IEL enxerga a rotatividade pelo volume de vagas reabertas, porque o RH da empresa quase nunca informa quem foi contratado nem por que saiu.
- **A plataforma atual só mapeia hard skill.** O Empregare registra escolaridade, Excel, Canva, BI e requisitos parecidos. Quando a empresa pede "uma pessoa comunicativa" ou alguém que viva o valor "união", o IEL não tem dado nenhum para responder. O perfil comportamental disponível lá mostra quatro quadrantes simples e trata do candidato isolado, sem relação com a cultura da empresa contratante.
- **As saídas de mercado existem e são inviáveis no volume do IEL.** O teste de fit do Empregare custa R$ 100,00 por candidato e cada acesso extra de analista custa R$ 50,00. A Mindsight já foi usada, funcionou bem e foi abandonada por custo. A operação trabalha 25 mil vagas por ano, cerca de 2.500 por mês, com 2.600 no mês passado. Qualquer solução cobrada por candidato quebra o orçamento de um serviço que é subsidiado para a indústria.
- **Quando o fit foi aplicado, virou trabalho manual em paralelo.** Nas turmas de aprendizagem, a equipe rodava Mindsight fora do Empregare, prova em outra plataforma, perfil comportamental em outra, e juntava três relatórios num Excel para montar o ranking. O pedido explícito é ter isso integrado ao banco que já existe, em ferramenta própria e sem depender de terceiro.
- **Impacto para o negócio do IEL.** A reputação do Centro de Empregos depende da qualidade dos cinco currículos enviados por vaga. Currículo tecnicamente certo que não fica na empresa desgasta a relação com a indústria, que é a porta de entrada para os outros negócios do IEL (treinamento, gestão, estágio), e frustra o candidato que é chamado e desligado em seguida.

## 2. Quem é o usuário/cliente afetado

São três públicos, e quem vai operar a solução no dia a dia é o analista do IEL.

| Público | Quem é | Como a dor aparece | O que isso exige da solução |
| --- | --- | --- | --- |
| Analista do Centro de Empregos (usuário principal) | Time com 30 acessos ao Empregare, que recebe a vaga, liga para a empresa, configura os filtros, faz a triagem e envia até 5 currículos | Decide só com dado técnico. Um filtro automático configurado errado expurga candidato aderente. Não recebe devolutiva de contratação | Uma tela única com técnico e fit lado a lado, ranking explicado e pouco clique. Não pode virar mais uma planilha paralela |
| Indústria parceira (cliente que recebe o valor) | RH enxuto ou o próprio dono, com foco em vaga operacional. Não paga pelo serviço e não acessa o Empregare | Turnover alto e custo de recontratação. Preenche o formulário de vaga "no básico do básico" e não tem tempo para etapa nova | Esforço mínimo: cerca de 5 minutos por colaborador respondente, com o analista do IEL conduzindo por telefone. Precisa de um argumento de economia para aderir |
| Candidato (usuário final) | Maioria operacional, com baixo letramento digital. Usa celular, mas trava em plataforma. Muitas vezes o IEL monta o currículo por ele | Entra em empresa cuja cultura não conhece (a vaga é publicada sem o nome da empresa), não se adapta e sai | Questionário curto, linguagem simples, situações do cotidiano de trabalho, no celular, sem login complicado. Entrevista por IA foi descartada pelo IEL para esse público |

- **Quem decide a adoção é a gestão do Centro de Empregos do IEL.** Ela precisa de custo marginal perto de zero por candidato, integração com o Empregare e aderência à LGPD. O IEL de Mato Grosso se apresenta como pioneiro em empregabilidade dentro da rede IEL, então a solução nasce com vitrine para os outros regionais.
- **A empresa tem uma segunda camada de respondentes.** O fit cultural da empresa é respondido por uma amostra de colaboradores de níveis e áreas diferentes, com peso para a área da vaga e áreas conexas. Esses colaboradores também são usuários, por 5 minutos cada, e a experiência deles define se o perfil cultural da empresa sai ou não sai.

## 3. Fluxo atual do processo onde a dor acontece

O IEL faz a atração e a triagem técnica, e o processo seletivo acontece dentro da empresa. A dor nasce em três pontos: na abertura da vaga (a cultura da empresa nunca é capturada), na triagem (só existe dado técnico) e depois do envio (não há devolutiva).

Fluxo (do diagrama do original):

```
Empresa preenche formulário de vaga
  → Analista IEL analisa e liga para completar
  → Vaga publicada no Empregare, sem nome da empresa
  → Candidatos se inscrevem (funil aberto)
  → Filtros automáticos: match técnico em %
  → Triagem do analista, só hard skill
  → Envio de até 5 currículos por vaga
  → Empresa faz entrevista e seleção por conta própria
      → Devolutiva em até 15 dias? Raramente → NPS e comentários
                                    Não       → Analista cobra e envia nova remessa de 5
      → Contratado sai; vaga reabre no mês seguinte → volta ao início
```

O ciclo fecha em si mesmo: a vaga reaberta volta para o início sem que ninguém registre por que a contratação anterior não durou.

- **Abertura da vaga.** A empresa preenche um formulário curto (dados cadastrais, cargo, perfil, benefícios, um campo livre de características), que chega ao IEL como planilha. Costuma vir básico demais para divulgar, e o analista liga para completar. Essa ligação é valiosa para o IEL porque é nela que aparecem outras demandas da empresa. Mesmo assim, nada sobre cultura é coletado de forma estruturada, nem no formulário nem na ligação.
- **Publicação e inscrição.** A vaga sai com o nome do IEL. O candidato só conhece atividade, localidade e segmento, e descobre a empresa na entrevista. Qualquer pessoa pode se inscrever, mesmo sem o requisito, e o funil fica aberto.
- **Filtros e triagem.** Os filtros automáticos do Empregare pontuam o currículo em percentual de match técnico. Se o analista configura o filtro errado, candidatos aderentes são descartados sem ninguém ver. A triagem humana que vem depois trabalha com o mesmo dado técnico.
- **Envio e silêncio.** Vão no máximo 5 currículos por vaga, porque o IEL não trabalha banco de vagas e cuida da expectativa do candidato. A vaga tem 30 dias para fechar, com a primeira triagem em até 15. A empresa conduz entrevista e etapas por conta própria e quase nunca informa o resultado. A meta interna de contratados foi retirada por falta desse dado. Sobraram o NPS e a dedução pelo número de vagas que reabrem.
- **Como era quando havia fit (Mindsight, turmas de aprendizagem).** A empresa mandava nome e e-mail corporativo de uma amostra de colaboradores (por exemplo, 10 de uma empresa de 50, com cerca de 20% da área da vaga e de áreas conexas). Cada um respondia em uns 5 minutos, com prazo de 3 dias, e o IEL precisava cobrar. Fechado o perfil da empresa, saía um link parametrizado para os candidatos, com 1 a 2 dias de prazo, e quem não respondia saía do processo. O relatório de aderência era gerado fora do Empregare e consolidado à mão no Excel junto com prova e perfil comportamental.

## 4. Hipóteses e validações levantadas pela equipe

A conversa de 19/09/2026 com a equipe do IEL e o Coringa validou a direção geral (camada própria de inteligência ao lado do Empregare, com fit cultural sem custo por candidato) e corrigiu dois entendimentos nossos sobre o que é fit cultural.

| Hipótese da equipe | O que ouvimos | Situação |
| --- | --- | --- |
| Manter o Empregare como base de currículos e vagas e construir ao lado um sistema de inteligência do IEL | "Eu quero fazer integrado, porque já tenho uma plataforma, já tenho um banco de dados". Trocar de plataforma em 48 horas não faz sentido e esbarra na LGPD | Validada |
| O fit precisa ser próprio do IEL, com custo marginal zero por candidato | R$ 100,00 por candidato no Empregare e a Mindsight abandonada por custo. "Precisa ser algo nosso, não dá para ser terceiro" | Validada |
| Três visões: analista do IEL, empresa e candidato | Aceita na conversa. A visão do analista é a principal | Validada |
| Perguntas em pares de situação (autonomia ou processos claros, por exemplo), respondidas dos dois lados, gerando ranking de aderência | O protótipo foi mostrado e o formato interativo agradou: "bem mais fácil de preencher" | Validada no formato. Conteúdo das dimensões ainda a fechar |
| O candidato responde o fit assim que entra na plataforma | Corrigida. O fit é aplicado quando ele se candidata à vaga daquela empresa, porque mede aderência à cultura daquela empresa | Ajustada |
| Gerar as perguntas do fit a partir do perfil da vaga | Corrigida. Fit cultural trata da cultura da empresa. A vaga se conecta com o perfil comportamental e com o técnico | Ajustada |
| Uma pessoa do RH responde pela empresa | Corrigida. Responde uma amostra de colaboradores de vários níveis e áreas, com peso para a área da vaga e conexas, e o perfil da empresa é a média | Ajustada |
| Mandar um segundo formulário para a empresa detalhar a vaga | Risco alto. "Se colocar mais uma etapa para a empresa, eles não vão fazer". O relacionamento por telefone precisa continuar | Reformulada: o analista conduz e registra durante a ligação |
| Campo para o analista registrar a cultura vivida, que aparece nas ligações, ao lado da cultura declarada | Bem recebida. Permite comparar o que a empresa diz com o que o IEL percebe | Validada como ideia. Falta desenhar |
| Assistente conversacional simples para o público operacional montar currículo e responder o fit | "Boa ideia". Entrevista por IA, por outro lado, não atrai esse público | Validada como ideia. Fora do núcleo do MVP |
| Integração com o Empregare por API | O Coringa confirmou que o caminho é API. Ninguém na conversa soube dizer o que o Empregare expõe | A validar com o Empregare. Plano B: importação da planilha que o IEL já exporta |
| Enviar o link do fit por e-mail ao candidato | O IEL usou e-mail com a Mindsight. O público operacional usa celular e trava em plataforma | A validar: link aberto no celular, sem login, enviado também por WhatsApp |

- **Regras de negócio que saíram da conversa e entram no MVP.** Aderência mínima de 35% para o candidato ser considerado compatível. O fit soma com o técnico e com o comportamental, e sozinho não garante encaminhamento. Máximo de 5 currículos por vaga. Candidato que não responde no prazo sai do processo. O nome da empresa não aparece para o candidato.
- **LGPD.** O Coringa descreveu o modelo que já rodava: a empresa envia só nome e e-mail corporativo dos colaboradores, e o consentimento é dado no aceite do questionário. Do lado do candidato, as perguntas ficam em preferências de trabalho e evitam dado sensível. Falta confirmar a base legal para o IEL tratar no sistema novo os dados que vêm do Empregare.
- **Argumento de adesão para a indústria.** O IEL pretende fazer uma implantação de cultura junto às empresas, mostrando quanto custa cada recontratação. O serviço segue sem cobrança adicional, apresentado como subsidiado. A solução precisa entregar esse número de economia de forma simples.
- **Base conceitual que sustenta o desenho.** A distinção entre cultura declarada e cultura vivida vem dos níveis de cultura de Schein (Organizational Culture and Leadership, 1985; 4ª ed., 2010). A medida de aderência pessoa-organização segue Kristof (Person-organization fit, Personnel Psychology, 1996) e o Organizational Culture Profile de O'Reilly, Chatman e Caldwell (Academy of Management Journal, 1991), que compara o perfil de valores da organização com o da pessoa. A meta-análise de Kristof-Brown, Zimmerman e Johnson (Personnel Psychology, 2005) associa esse fit a maior permanência e menor intenção de saída, que é o resultado que o IEL busca.

## 5. Pergunta ao Coringa: qual seria a expansão da solução

O Coringa já apontou três caminhos de expansão na conversa de 19/09/2026: juntar prova e perfil comportamental ao fit numa plataforma só, levar a solução do público de aprendizagem para todo o Centro de Empregos e abrir caminho para os outros IEL regionais.

- **O tripé do processo seletivo numa plataforma só.** Nas palavras dele, três itens são importantes: fit cultural, perfil comportamental e prova. Hoje cada um roda num lugar (o comportamental básico no Empregare, a prova em outra ferramenta com QR Code, o fit em terceiro) e o ranking sai de um Excel montado à mão. A expansão natural do MVP é gerar esse ranking único com as três notas, pronto para mandar à empresa.
- **Do piloto para o volume todo.** A Mindsight só foi usada em turmas específicas de aprendizagem. A expansão é rodar o fit nas cerca de 2.500 vagas mensais do Centro de Empregos, começando pelas indústrias com maior rotatividade, como os frigoríficos.
- **Fechar o ciclo da devolutiva.** O IEL não sabe quem foi contratado nem quem saiu. Um retorno de um clique para o RH (contratei, não contratei, saiu em menos de 90 dias) daria ao sistema o dado que falta para provar a redução de turnover e calibrar o corte de 35%.
- **Rede IEL e serviço pago.** O IEL de Mato Grosso se coloca como referência em empregabilidade, e outros regionais estão começando. A mesma base também pode alimentar o serviço pago de Recrutamento e Seleção, que hoje usa psicólogo e perfil comportamental em fluxo separado.

Perguntas que levamos ao Coringa para fechar o rumo da expansão:

1. Das três frentes (prova integrada, perfil comportamental mais completo, devolutiva de contratação), qual entra primeiro depois do fit cultural?
2. O perfil cultural de uma empresa pode ser reaproveitado em todas as vagas dela por quanto tempo antes de ser refeito?
3. A expansão para outros IEL regionais pressupõe o Empregare ou precisa funcionar com qualquer plataforma de vagas, como a Gupy usada em outras frentes do sistema?
4. O programa de estágio, que usa a plataforma Valoriza, entra no mesmo desenho?
5. O relatório de aderência vai para a empresa junto com os 5 currículos ou fica só para uso interno do analista?
6. Qual indicador a diretoria do IEL aceitaria como prova de resultado: queda nas vagas reabertas por empresa, NPS ou permanência em 90 dias?

## 6. Conclusão da equipe sobre o problema real

O problema real do IEL é decidir quais 5 currículos enviar sem nenhum dado sobre a cultura da empresa e sobre o comportamento do candidato, num volume de 2.500 vagas por mês em que toda solução de mercado cobra por candidato.

- **Atração e match técnico o IEL já resolve.** A operação bate a meta, tem banco de currículos grande e uma plataforma que atende bem o requisito técnico. O que falta é a segunda metade da decisão: saber se aquela pessoa se sustenta naquela empresa. Essa informação hoje só aparece depois da contratação, na forma de vaga reaberta.
- **O fit cultural tem dois lados e o lado da empresa é o mais difícil.** Primeiro se constrói o perfil cultural da empresa, com uma amostra de colaboradores de níveis e áreas diferentes. Depois o candidato responde as mesmas dimensões no momento em que se candidata à vaga daquela empresa. A aderência mínima é de 35% e ela soma com o técnico e o comportamental. O gargalo operacional está em conseguir as respostas da empresa, que tem pouco tempo e pouca disposição para etapa nova.
- **A solução precisa caber em quatro restrições.** Custo marginal zero por candidato. Integração com o Empregare, que continua sendo a base de currículos e vagas. Esforço mínimo para a empresa, com o analista do IEL conduzindo pelo relacionamento que já existe. Linguagem e navegação simples para um candidato operacional com baixo letramento digital, no celular.
- **Recorte do MVP.** Uma camada de inteligência do IEL ao lado do Empregare com três entregas: o perfil cultural da empresa (coletado com a amostra de colaboradores e complementado pelo analista com o que ele percebe nas ligações), o questionário de fit do candidato disparado na candidatura e o painel do analista, que mostra técnico e fit lado a lado, ranqueia com o corte de 35% e ajuda a escolher os 5 currículos.
- **Como vamos saber que funcionou.** Queda no número de vagas reabertas pela mesma empresa no mês seguinte, taxa de resposta do fit acima do necessário para fechar o perfil em 3 dias e tempo do analista por vaga igual ou menor que o atual. Prova, perfil comportamental completo, devolutiva de contratação e expansão para outros IEL ficam para depois do MVP, conforme a resposta do Coringa.

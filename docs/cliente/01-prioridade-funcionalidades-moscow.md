# Prioridade de Funcionalidades (MoSCoW): Desafio IEL

> Transcrição do PDF `Prioridade de Funcionalidades (MoSCoW) Desafio IEL.pdf`. Conteúdo preservado; formatação adaptada para Markdown.

## 1. Funcionalidades Must Have

O MVP das 48 horas entrega o ciclo completo do fit cultural de ponta a ponta: a empresa vira um perfil, o candidato responde na candidatura e o analista do IEL vê técnico e fit lado a lado para escolher os 5 currículos. São sete funcionalidades, e sem qualquer uma delas o ciclo não fecha na demonstração.

| # | Funcionalidade | O que entrega | Por que é Must |
| --- | --- | --- | --- |
| M1 | Perfil cultural da empresa | Questionário curto de pares de situação (autonomia ou processos claros, por exemplo), respondido em cerca de 5 minutos por uma amostra de colaboradores de níveis e áreas diferentes. O perfil da empresa é a média das respostas | É a base do fit. O IEL deixou claro que fit cultural mede a cultura da empresa e que uma pessoa só do RH não responde por ela |
| M2 | Link por colaborador, sem login, com contador de respostas | O analista cadastra nome e e-mail corporativo, o sistema gera os links e mostra quantos responderam de quantos, dentro do prazo de 3 dias | Conseguir as respostas da empresa foi apontado como gargalo: "a gente tem que ficar em cima". O analista precisa ver isso numa tela |
| M3 | Questionário de fit do candidato | Mesmas dimensões do perfil da empresa, em linguagem simples e situações do dia a dia de trabalho, no celular, sem login, vinculado à vaga em que ele se candidatou. O nome da empresa não aparece | Público operacional com baixo letramento digital. O fit é aplicado na candidatura à vaga daquela empresa, conforme correção do Coringa |
| M4 | Motor de aderência | Cálculo do percentual de aderência entre candidato e empresa, por dimensão e no total, com o corte mínimo de 35% | É a regra de negócio informada pelo IEL e o número que o analista vai usar para decidir |
| M5 | Painel do analista por vaga | Ranking dos candidatos com match técnico e fit lado a lado, leitura das dimensões em que cada um combina ou destoa da empresa e marcação dos até 5 currículos a enviar | É a tela do usuário principal. Substitui o Excel montado à mão que juntava três relatórios |
| M6 | Entrada dos dados do Empregare por importação de planilha | Upload da planilha de vaga e de candidatos que o IEL já exporta, com o percentual de match técnico | Garante a integração na demonstração sem depender de API que ninguém confirmou existir. A base de currículos continua no Empregare |
| M7 | Consentimento e proteção de dados | Aceite no início de cada questionário, coleta só de nome e e-mail corporativo do colaborador, perguntas restritas a preferências de trabalho, sem dado sensível | A LGPD foi citada pelo IEL como o que pode barrar a solução. Reproduz o modelo de autorização que eles já usavam |

- **Regra de corte para as 48 horas.** Se o tempo apertar, M5, M4 e M3 ficam inteiros. M1 e M2 rodam com uma empresa exemplo já respondida, M6 com uma planilha de exemplo e M7 vira uma tela simples de aceite. O que aparece no pitch é o analista abrindo uma vaga e enxergando o ranking com fit. Tudo o que não ajuda essa cena espera.
- **Custo marginal zero por candidato.** Nenhuma funcionalidade Must depende de serviço cobrado por uso. O questionário, o cálculo e o painel rodam sem IA paga no caminho crítico, porque o fit a R$ 100,00 por candidato foi o motivo de o IEL não usar o que já existe.

## 2. Funcionalidades Should, Could e Won't

Os Should entram no MVP nessa ordem se sobrar tempo, os Could ficam para a evolução logo depois do hackathon e os Won't estão fora do escopo por decisão da equipe, quase sempre por algo que o próprio IEL disse na conversa de 19/09/2026.

### Should Have (importantes, entram se houver tempo)

| # | Funcionalidade | O que entrega | Por que não é Must |
| --- | --- | --- | --- |
| S1 | Cultura declarada e cultura percebida | O analista responde as mesmas dimensões com o que percebe nas ligações com a empresa, e o painel mostra as duas leituras lado a lado | É o diferencial conceitual da equipe e foi bem recebido. O ciclo fecha sem ele |
| S2 | Resgate de candidatos descartados pelo filtro | Lista de quem ficou abaixo do filtro técnico automático e tem fit alto, para o analista revisar | Ataca a dor do filtro configurado errado que expurga gente aderente. Depende de a planilha trazer os descartados |
| S3 | Relatório de aderência para a empresa | Uma página por candidato enviado, com o percentual e as dimensões, para acompanhar os 5 currículos | Aumenta o valor percebido pela indústria. O analista consegue decidir sem ele |
| S4 | Lembrete aos colaboradores que não responderam | Reenvio do link por e-mail ou WhatsApp a partir do contador de respostas | Reduz a cobrança manual. Na demonstração, o contador já mostra o problema resolvido pela metade |
| S5 | Calculadora de economia com rotatividade | Quanto a empresa gasta recontratando a mesma vaga, para o analista usar na conversa de adesão | O IEL quer esse argumento para a implantação de cultura. É peça de convencimento, fora do fluxo operacional |

### Could Have (desejáveis, ficam para a evolução)

| # | Funcionalidade | O que entrega | Por que fica para depois |
| --- | --- | --- | --- |
| C1 | Integração com o Empregare por API | Candidatura no Empregare dispara o link do fit sozinha e o match técnico chega sem upload | Depende do que o Empregare expõe, e isso ninguém soube informar. A planilha cobre o MVP |
| C2 | Assistente conversacional para o público operacional | Conversa guiada, com opção de áudio, para montar currículo e responder o fit | Ideia aprovada pelo IEL, mas pede IA no caminho do candidato e mais tempo de teste com o público real |
| C3 | Devolutiva de um clique do RH | Contratei, não contratei, saiu em menos de 90 dias | Fecha o ciclo de dados que hoje não existe. Só faz sentido com vagas reais rodando |
| C4 | Validade e reaproveitamento do perfil cultural | O perfil da empresa serve para todas as vagas dela por um período e avisa quando precisa ser refeito | Depende de resposta do Coringa sobre o prazo de validade |
| C5 | IA que lê as anotações do analista | Sugere ajustes no perfil cultural a partir do que foi registrado nas ligações | Precisa de volume de anotações para ter utilidade |
| C6 | Painel gerencial | Vagas reabertas por empresa, taxa de resposta do fit, tempo por vaga | Mede o resultado do piloto. Sem piloto não há dado |

### Won't Have (fora do escopo agora)

| Funcionalidade | Motivo |
| --- | --- |
| Substituir o Empregare ou migrar o banco de currículos | O IEL quer integrar ao que já tem. A migração esbarra na LGPD e não cabe em 48 horas |
| Prova de conhecimento integrada | Faz parte do tripé desejado pelo IEL (fit, comportamental e prova) e entra no roadmap depois do fit validado |
| Perfil comportamental completo | O Empregare já oferece um básico de quatro quadrantes. Aprofundar exige instrumento próprio e validação técnica |
| Entrevista por vídeo ou por IA | O IEL afirmou que isso não atrai o público operacional, e a maioria das entrevistas é presencial |
| Login e área logada para a empresa | A empresa não acessa nem o Empregare. Mais uma etapa para ela foi apontada como risco de não adesão |
| Gestão do processo seletivo dentro da empresa | O IEL faz atração e triagem. A seleção é da empresa, e entrar nisso tiraria a agilidade da operação |
| Vagas estratégicas, estágio (Valoriza) e outros IEL regionais | O Centro de Empregos trabalha vaga operacional e tática. As demais frentes ficam para a fase de expansão |

## 3. Critério de sucesso do MVP

O MVP é bem-sucedido se, na apresentação de domingo, 20/09/2026, a equipe demonstrar ao vivo uma vaga percorrendo o ciclo inteiro e o IEL reconhecer ali o processo dele resolvido sem custo por candidato.

| Critério | Como se verifica na demonstração |
| --- | --- |
| Ciclo completo funcionando | Uma empresa exemplo com perfil cultural formado pela amostra de colaboradores, uma vaga importada da planilha do Empregare e candidatos respondendo o fit pelo celular, até o ranking aparecer no painel |
| Tempo de resposta compatível com o que o IEL já praticava | Colaborador e candidato concluem o questionário em cerca de 5 minutos, no celular, sem criar conta |
| Decisão do analista numa tela só | Match técnico e aderência cultural lado a lado, corte de 35% aplicado e até 5 currículos marcados para envio, sem planilha paralela |
| Regras do IEL respeitadas | Fit aplicado na candidatura à vaga, perfil da empresa como média de vários respondentes, nome da empresa oculto para o candidato e aceite de uso de dados nos dois questionários |
| Custo marginal zero | Nenhuma etapa do caminho crítico depende de serviço cobrado por candidato ou por acesso |
| Validação do cliente | O Coringa e a equipe do IEL confirmam, antes do pitch, que o fluxo "está no caminho certo", como combinado na conversa |

- **O que vamos medir quando houver vaga real rodando.** Os indicadores de resultado são os três que fecharam o documento de entendimento do desafio: queda no número de vagas reabertas pela mesma empresa no mês seguinte, quantidade de respostas suficiente para fechar o perfil da empresa no prazo de 3 dias e tempo do analista por vaga igual ou menor que o atual. No hackathon esses números ainda não existem, e o MVP já nasce preparado para registrar os três.
- **O que tira ponto do MVP.** Qualquer passo que exija mais uma etapa da empresa sem o analista por perto, tela que o candidato operacional não consiga concluir sozinho e dependência de integração que ainda não foi confirmada com o Empregare.

## 4. Roadmap da solução

A solução evolui em cinco fases: o MVP do hackathon prova o ciclo do fit, o piloto prova a redução de vagas reabertas, a integração tira o trabalho manual, o tripé junta prova e perfil comportamental e a última fase leva o produto para a rede IEL.

| Fase | Horizonte | O que entra | Marco de saída |
| --- | --- | --- | --- |
| 1. MVP do hackathon | 48 horas, até 20/09/2026 | Must M1 a M7 e os Should que couberem, na ordem S1 a S5 | Ciclo completo demonstrado e validado com o Coringa |
| 2. Piloto com indústrias | Primeiros 30 dias após o hackathon | Operação real com indústrias de alta rotatividade, como os frigoríficos. Entram S1 a S5 que tiverem ficado de fora, a devolutiva de um clique (C3) e o painel gerencial (C6) | Primeiros perfis culturais de empresas reais fechados no prazo de 3 dias e primeiras remessas de 5 currículos escolhidas com fit |
| 3. Integração e automação | Até 90 dias | API com o Empregare (C1) para disparar o fit na candidatura e receber o match técnico sem upload, validade do perfil cultural por empresa (C4) e adequação formal à LGPD com o jurídico do IEL | Analista deixa de importar planilha e o fit passa a rodar em todas as vagas das empresas do piloto |
| 4. Tripé do processo seletivo | Até 6 meses | Prova de conhecimento e perfil comportamental mais completo dentro da mesma plataforma, com ranking único das três notas. Assistente conversacional para o público operacional (C2) e leitura das anotações do analista por IA (C5) | O Excel de consolidação deixa de existir e o ranking sai pronto para a empresa |
| 5. Rede IEL e novos serviços | Até 12 meses | Oferta para outros IEL regionais, independente da plataforma de vagas de cada um, extensão para o estágio (Valoriza) e apoio ao serviço pago de Recrutamento e Seleção | Primeiro regional fora de Mato Grosso usando a solução |

- **O que destrava cada passagem de fase.** Da fase 1 para a 2, o aceite do IEL para rodar com vagas reais. Da 2 para a 3, a resposta do Empregare sobre o que a API expõe. Da 3 para a 4, a escolha do Coringa sobre qual frente do tripé vem primeiro. Da 4 para a 5, o resultado do piloto em vagas reabertas, que é o número que convence outro regional.
- **O que se mantém em todas as fases.** Custo marginal zero por candidato, Empregare como base de currículos e vagas, analista do IEL conduzindo o relacionamento com a empresa e questionário curto no celular para o candidato.

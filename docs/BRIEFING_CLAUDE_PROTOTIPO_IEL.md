# Briefing para Claude — Central de Seleção e Compatibilidade IEL

## 1. Sua missão

Claude, prepare um protótipo web navegável sobre a base Arki existente neste projeto. A entrega deve apresentar o fluxo completo de seleção assistida por dados para o IEL: reunir informações, entender uma vaga, comparar candidatos, esclarecer uma lacuna e preparar um encaminhamento para a empresa.

Pode usar dados fictícios, integrações simuladas e respostas de IA previamente preparadas. O protótipo precisa ter comportamento consistente: um candidato selecionado em uma tela aparece selecionado nas demais; uma resposta a uma pendência atualiza a análise; um encaminhamento aparece para o gestor correspondente.

Não estamos pedindo uma landing page, slides ou apenas imagens de telas. Queremos um produto que possa ser explorado e demonstrado. A implementação funcional da interface é o objetivo desta etapa. Conectores reais, modelo de IA em produção e infraestrutura operacional completa ficam para depois.

Este briefing consolida a direção mais recente da conversa com o usuário. Ele substitui, para fins desta implementação, propostas anteriores que colocavam uma entrevista com IA como centro do produto. O foco acordado agora é **seleção, integração e análise dos dados existentes**. Coleta complementar entra quando falta informação.

**Frase de apresentação:** uma central para o IEL reunir os dados de talentos, vagas e empresas, entender compatibilidades e conduzir uma seleção fundamentada.

## 2. Entenda o contexto antes de desenhar

### Quem é quem

O desafio é do IEL e fala em conectar talentos e empresas. O usuário principal que adotaremos no protótipo é o analista do IEL/Centro de Empregabilidade, que acompanha processos de empresas atendidas.

Imagine a estrutura como uma central que apoia várias empresas: cada empresa oferece oportunidades e cada candidato pode participar de processos. O IEL acompanha os registros aos quais tem acesso e ajuda na seleção e nos encaminhamentos. A comparação com uma entidade intermediadora de oportunidades ajuda a entender o papel; não significa afirmar que o IEL funciona exatamente como outra instituição ou atende apenas estágios.

Uma candidatura à vaga de uma empresa atendida não é uma candidatura para trabalhar no próprio IEL. As empresas devem ter nome e contexto visíveis na interface.

A divisão operacional exata entre IEL e empresas não foi detalhada no enunciado. Para a simulação, adotaremos: analista IEL organiza a seleção e encaminha; RH/gestor da empresa consulta a lista, pede informações e indica quem deseja entrevistar. Apresente isso como desenho do produto, não como processo institucional já confirmado.

### O que o enunciado afirma

- O IEL já dispõe de informações sobre talentos, oportunidades e características das empresas.
- O Empregare é usado para divulgar oportunidades e realizar o matching inicial a partir de requisitos e informações dos candidatos.
- Uma avaliação de fit cultural ocorre em solução externa e é aplicada em processos específicos, geralmente depois de uma análise técnica inicial.
- Informações estão fragmentadas entre ferramentas e etapas; a consolidação aumenta o esforço operacional.
- Interesses, expectativas, aspirações e aspectos organizacionais nem sempre estão estruturados ou integrados.
- Custo, tempo e etapas adicionais limitam a aplicação mais ampla da análise de aderência.
- O desafio aceita um recorte que melhore a jornada de forma demonstrável. Integração técnica real com o Empregare não é exigida no hackathon.

### O que ainda não sabemos

Não conhecemos o esquema real da base, a cobertura de cada campo, o fornecedor de avaliação cultural, as permissões das APIs, os contratos ou os indicadores operacionais do IEL. Não invente nomes de fornecedores, índices de retenção, taxas de economia ou estatísticas históricas como se fossem reais.

A referência do usuário a um painel parecido com Power BI orienta a experiência: visão integrada, filtros, agrupamentos e afinidades. Não significa que Power BI seja uma exigência técnica do enunciado.

### A analogia que deve orientar o produto

Pense numa mesa de trabalho do analista. Antes, ele abre currículo em uma ferramenta, avaliação em outra, informações da vaga em outro lugar e precisa juntar tudo mentalmente. Nossa aplicação coloca esses registros lado a lado, mostra suas origens e ajuda a decidir o que fazer em seguida.

O painel funciona como um mapa: ajuda a enxergar relações e caminhos. Um campo sem dados é uma parte ainda não mapeada, não uma região ruim. A IA ajuda a ler esse mapa e explicar as evidências; não deve preencher os espaços desconhecidos com conclusões inventadas.

## 3. A escolha de produto

### O que vamos construir

Uma central com duas camadas conectadas:

1. **Visão operacional e analítica:** empresas, vagas, candidaturas, pendências, cobertura de dados e encaminhamentos.
2. **Mesa de seleção por vaga:** comparação de candidatos, compatibilidade por dimensão, evidências, esclarecimentos e lista de encaminhamento.

Uma pessoa deve conseguir sair do panorama geral e chegar ao trecho de informação que sustenta uma conclusão. Também deve conseguir agir: selecionar, comparar, pedir esclarecimento, registrar uma justificativa e encaminhar.

### Onde a IA agrega

- Organizar informações textuais já disponíveis em campos comparáveis.
- Relacionar experiências declaradas às atividades da vaga, mesmo quando os títulos dos cargos diferem.
- Resumir convergências, divergências e informações desconhecidas.
- Explicar as conclusões com referência às fontes autorizadas.
- Sugerir perguntas específicas para lacunas relevantes.
- Preparar um resumo de encaminhamento que o analista revisa.

No protótipo, essas operações podem ser determinísticas, com respostas curadas a partir da base fictícia. O usuário deve saber que está num ambiente de demonstração. Não exigir chave de API para a experiência principal.

### O que não é prioridade

Não construir um novo portal público de vagas, editor de anúncios, candidatura completa, sistema de pagamentos, suíte de treinamento, testes psicológicos próprios, análise de emoção em vídeo ou um chatbot aberto como tela inicial.

Não obrigar todos os candidatos a repetir entrevista e cadastro. Não ampliar o MVP para simulações de rotina, avaliação de aprendizagem, planos de carreira ou acompanhamento pós-contratação.

Não apresentar um ranking universal de melhores pessoas. A análise depende da oportunidade, dos critérios e dos dados disponíveis.

## 4. Recrutamento, seleção e origem dos dados

Para esta proposta, o recrutamento segue no sistema utilizado pela operação. O RH publica a vaga lá, e o candidato se inscreve lá. Nossa aplicação recebe as informações autorizadas e apoia a etapa de seleção.

Fluxo desejado em produção:

**Sistema de recrutamento → dados autorizados de vagas e candidaturas → central do IEL → análise e encaminhamento → retorno ao processo original, quando suportado.**

Empregare, Gupy e outros sistemas são possíveis origens, não integrações já prontas. Cada conector depende de recursos e permissões próprios. O Empregare anuncia API e webhooks; a Gupy documenta eventos de candidatura; não confirmamos o mesmo fluxo para InfoJobs Brasil. Uma API pública não implica acesso irrestrito aos dados de qualquer empresa.

No protótipo, use fontes simuladas:

- `Empregare — demonstração`: vagas, candidaturas e experiências do currículo.
- `Avaliação externa — demonstração`: resultados de avaliações já realizadas, com metodologia fictícia identificada.
- `Contexto da empresa — demonstração`: atividades, rotina e condições confirmadas pelo gestor.
- `Registro IEL — demonstração`: anotações de análise, expectativas previamente coletadas e encaminhamentos.

Esses conjuntos devem estar relacionados por identificadores coerentes. Não juntar pessoas automaticamente apenas porque têm o mesmo nome.

Uma tela pode mostrar o recebimento de uma atualização fictícia. Não simular uma conexão real com credenciais inventadas, não enviar mensagens reais e não depender de login em plataformas externas.

A importação manual pode aparecer como contingência futura. O fluxo central da demonstração já deve começar com dados reunidos e mostrar o benefício da integração.

## 5. Papéis e limites de acesso

| Papel | Pode ver e fazer na demonstração |
| --- | --- |
| Analista IEL | Vagas e candidaturas das empresas da base demo; fontes autorizadas; comparação; pendências; preparação e registro de encaminhamento. |
| RH/gestor da empresa | Apenas sua empresa e os perfis compartilhados no encaminhamento; resposta a pendências da equipe; indicação de interesse em entrevista. |
| Candidato | Sua solicitação específica de esclarecimento e sua resposta; nenhuma informação sobre outros candidatos ou avaliações internas. |

Para mostrar a jornada, crie um seletor de persona no ambiente demo. Rotule como **“Visualizar como — demonstração”**, nunca como prova de autenticação ou segurança de produção. O seletor pode ficar numa barra discreta fora da navegação normal do produto.

Ao mudar para gestor da empresa A, não mostrar a base completa do IEL nem dados da empresa B. Ao abrir o link de esclarecimento do candidato, exibir somente o contexto mínimo necessário.

A relação IEL–empresas merece cuidado: no Arki, organizações isoladas não equivalem automaticamente a uma central com acesso autorizado a várias empresas. Modele explicitamente o escopo da demonstração. Não desative a proteção de rotas reais para facilitar o mock.

## 6. O conceito de compatibilidade

### Três dimensões principais

1. **Técnica:** relação entre requisitos/atividades da vaga e experiências ou competências registradas.
2. **Profissional:** interesses, aspirações, disponibilidade e expectativas em relação à oportunidade.
3. **Organizacional:** condições de trabalho, orientação, autonomia, comunicação e avaliações de aderência existentes, quando aplicáveis.

A dimensão organizacional considera contexto, não semelhança de personalidade entre as pessoas. “Precisa de orientação inicial” não significa “baixa capacidade”. “Prefere decisões documentadas” não significa “não sabe trabalhar em equipe”.

### Estados sugeridos por critério

- **Alinhamento identificado:** existe informação que sustenta a relação.
- **Ponto a esclarecer:** a interpretação ou condição precisa ser confirmada.
- **Divergência identificada:** há informações explícitas em conflito.
- **Sem informação:** não há base suficiente para analisar.
- **Não se aplica:** critério fora do escopo daquela vaga.

Cada estado deve ter texto, ícone e explicação; nunca depender apenas de cor. Uma divergência negociável e o não atendimento confirmado de um requisito obrigatório devem ter consequências diferentes. Não eliminar automaticamente: sinalizar o requisito e manter a decisão humana registrada.

### Cobertura não é afinidade

A interface pode informar “6 de 8 critérios possuem dados suficientes”, com definição de cada critério. Isso mede cobertura informacional. Não significa 75% de chance de sucesso ou 75% de qualidade da pessoa.

Evite uma nota global de fit no MVP. A matriz por dimensão é mais explicável e não obriga a inventar pesos. Se exibir a nota original de uma avaliação externa, preserve escala, data, método e origem; não misture notas de metodologias diferentes.

### Toda conclusão deve abrir uma evidência

Exemplo de evidência:

- Informação: “Conferia pedidos e identificava divergências de quantidade.”
- Origem: currículo fictício, experiência na Loja Horizonte.
- Natureza: relato do candidato, não verificação prática.
- Critério relacionado: conferência de pedidos na vaga.
- Atualização: data fixa da base demo.
- Interpretação: experiência relacionada; autonomia na execução ainda não verificada.

Duas fontes podem discordar. Exiba a divergência e peça confirmação em vez de escolher silenciosamente uma versão.

## 7. Navegação e estrutura de telas

Navegação principal proposta:

- Visão geral
- Vagas
- Talentos
- Empresas
- Pendências
- Encaminhamentos
- Fontes de dados

“Talentos” é o conjunto de perfis autorizados; “candidaturas” são vínculos desses perfis com vagas. Uma pessoa pode ter mais de uma candidatura. Evite duplicá-la na base de talentos.

A análise assistida pode ser uma área contextual dentro da vaga/comparação. Não colocar “Chat IA” como seção dominante. O analista deve perceber claramente sobre qual vaga e quais pessoas está perguntando.

As rotas finais devem seguir a arquitetura e os helpers do repositório. Os nomes abaixo descrevem telas e não impõem caminhos literais.

### Tela 1 — Visão geral do IEL

**Pergunta que responde:** onde o analista precisa agir hoje?

Conteúdo:

- Cabeçalho com contexto IEL e identificação discreta do ambiente demonstrativo.
- Indicadores calculados: vagas abertas, candidaturas em análise, solicitações pendentes e encaminhamentos aguardando retorno.
- Lista de vagas que precisam de ação, com empresa e motivo.
- Gráfico simples de candidaturas por etapa, com acesso aos registros ao clicar.
- Cobertura de informações por dimensão, com denominador e explicação.
- Atividades recentes reais do estado local: pendência respondida, análise atualizada, encaminhamento criado.

Filtros: empresa e status da vaga. Se houver período, ele precisa filtrar os registros e gráficos de fato; pode ser deixado para depois se não estiver funcional.

Não preencher a home com faturamento, MRR, usuários online ou métricas herdadas de SaaS sem relação com o processo.

### Tela 2 — Lista de vagas

**Pergunta:** qual processo vou trabalhar?

Tabela com nome da vaga, empresa, localidade, origem, quantidade de candidaturas, etapa operacional e pendências. Busca por título/empresa, filtros e ordenação precisam funcionar.

A ação principal é **“Abrir seleção”**. Não oferecer “Publicar vaga” como fluxo central. O registro deve informar sua origem e última atualização simulada.

### Tela 3 — Mesa de seleção da vaga

Esta é a tela principal da apresentação. Priorize sua qualidade.

Cabeçalho com vaga, empresa, status, requisitos essenciais e contexto organizacional resumido. Use abas ou áreas como **Candidatos**, **Contexto da vaga** e **Histórico**.

Na matriz de candidatos, mostrar:

- Nome e resumo profissional curto.
- Etapa da candidatura.
- Dimensão técnica.
- Expectativas profissionais.
- Contexto organizacional.
- Cobertura das informações.
- Pendências relevantes.
- Seleção para comparação e ação de ver detalhe.

Os estados das células devem abrir ou destacar suas evidências. A matriz precisa ser legível sem abrir seis perfis consecutivamente. Nomes de candidatos e cabeçalhos devem continuar compreensíveis durante a rolagem.

Permitir selecionar de dois a três candidatos para comparar. A interface explica o limite e mantém a seleção ao abrir um perfil e voltar. Separar **seleção temporária para comparação** de **lista de encaminhamento**.

Na área contextual de IA, oferecer ações como “Resumir esta seleção”, “Comparar os selecionados” e “Mostrar o que falta esclarecer”. As respostas devem usar os registros efetivamente selecionados.

### Tela 4 — Perfil consolidado do talento

Pode ser página própria com retorno à vaga ou painel lateral com espaço suficiente.

Mostrar resumo profissional, experiências, competências declaradas, expectativas, avaliações existentes e origens. Exibir datas e fontes sem sobrecarregar a primeira leitura; detalhes podem ficar num painel de evidências.

Quando aberto a partir da vaga, manter “Análise para Assistente de Logística — Cerrado Distribuição”. Não apresentar uma compatibilidade geral descontextualizada.

Ações: adicionar à lista de encaminhamento, registrar nota interna, solicitar esclarecimento e abrir comparação. Notas internas ficam separadas dos dados compartilháveis.

Se avaliações estiverem ausentes, dizer “Avaliação não disponível”, sem nota zero. Se estiverem presentes, permitir consultar o resumo de origem, sem inventar que uma nova avaliação foi aplicada.

### Tela 5 — Comparação entre candidatos

Mostrar dois ou três candidatos lado a lado, usando os mesmos critérios da vaga. A primeira coluna contém os critérios, e cada célula pode revelar a evidência correspondente.

Uma síntese pode dizer:

> Ana relata experiência com conferência de pedidos e interesse em estoque, mas o acompanhamento inicial ainda precisa ser esclarecido. Bruno possui experiência relacionada e preferência declarada por autonomia; seu interesse nas atividades de estoque não está registrado.

Permitir abrir a fonte, criar uma pendência ou adicionar um candidato à lista. Evitar botões como “Contratar o melhor” ou “Escolha automática”.

### Tela 6 — Contexto da empresa e da equipe

A lista de empresas leva a um detalhe com equipes, vagas associadas e informações organizacionais registradas. Separar descrição institucional de condições específicas da equipe.

Exemplo: a empresa se descreve como colaborativa; a equipe da vaga atua em turnos com pouca sobreposição. Isso requer uma explicação concreta sobre o apoio disponível.

Mostrar “confirmado pelo gestor”, “origem: descrição da vaga” ou “a confirmar”, com datas. O analista pode criar uma solicitação direcionada a uma condição ausente. No perfil gestor, essa solicitação pode ser respondida.

O cadastro extensivo de empresas não é necessário para o protótipo. As empresas já existem na base mock.

### Tela 7 — Pendências e esclarecimentos

Lista agrupável por destinatário ou vaga, com motivo, critério afetado, data e estado: rascunho, solicitada, respondida, incorporada ou cancelada.

Criar uma solicitação exige destinatário, pergunta e indicação do que será compartilhado. Antes de enviar, o analista revisa o texto sugerido pela IA.

O envio é simulado. A UI pode disponibilizar **“Abrir experiência do destinatário”** na barra demo. Não disparar e-mail/WhatsApp real. Não apresentar um toast de entrega real.

A resposta fica registrada. Ao incorporá-la à análise, atualizar a origem, o estado do critério e os contadores. Preservar no histórico a conclusão anterior e a informação que motivou a mudança.

### Tela 8 — Experiência do destinatário

Duas variações pequenas, acessíveis pela demonstração:

- **Gestor:** contexto da vaga, pergunta sobre a equipe, campo de resposta e confirmação.
- **Candidato:** empresa/vaga, por que aquela informação é solicitada, pergunta, resposta revisável e confirmação.

Não transformar esse fluxo em entrevista completa ou portal de candidatura. Se a pessoa disser que não sabe ou não deseja responder, manter a lacuna sem inventar uma resposta ou penalidade automática.

Depois de concluir, mostrar uma confirmação clara e um retorno para o roteiro demo. Respostas precisam aparecer no painel do analista.

### Tela 9 — Preparação do encaminhamento

O analista reúne candidatos de uma única vaga numa lista, revisa o resumo individual, os pontos de atenção e a mensagem para a empresa.

Permitir remover um perfil, editar uma justificativa e visualizar exatamente o que o destinatário receberá. Excluir por padrão notas internas e dados de outras empresas.

Botão final: **“Registrar encaminhamento”**. No ambiente mock, cria um registro local e disponibiliza a visão do gestor. Rotular eventual retorno ao sistema original como “Atualização externa não enviada — demonstração”.

Não confundir preparar lista, encaminhar para análise e contratar. São ações e estados diferentes.

### Tela 10 — Visão da empresa/gestor

O gestor acessa a vaga e a lista encaminhada. Vê evidências compartilhadas, resumo e perguntas sugeridas para entrevista. Pode indicar **“Quero entrevistar”**, **“Solicitar esclarecimento”** ou **“Não avançar”**, registrando uma justificativa operacional no último caso.

“Quero entrevistar” não agenda uma reunião. Registra a intenção, atualiza o histórico e retorna o estado ao painel IEL. Agendamento real não faz parte desta entrega.

### Tela 11 — Fontes de dados

Mostrar quais tipos de informação estão disponíveis, sua origem, última atualização simulada, registros recebidos e eventuais erros.

Incluir uma ação **“Simular recebimento de atualização”** para um evento fixo. Receber novamente o mesmo evento não pode duplicar candidatura ou candidato.

Uma falha simulada deve preservar os dados anteriores e informar que podem estar desatualizados. Permitir tentar novamente. Não precisa construir infraestrutura real de sincronização, mas a interface deve mostrar que integração é parte da proposta.

## 8. Base fictícia única

Use a mesma base em todas as telas, com identificadores estáveis, datas fixas e empresas explicitamente fictícias. Não gere números aleatórios a cada renderização. Use contatos no domínio `example.com` e não inclua CPF, diagnósticos ou dados clínicos.

### Empresas e equipes

| ID | Empresa fictícia | Contexto |
| --- | --- | --- |
| EMP-01 | Cerrado Distribuição | Operação logística com turnos; apoio inicial da equipe ainda precisa de confirmação. |
| EMP-02 | Horizonte Alimentos | Apoio administrativo ao estoque; gestor confirmou colega de referência no início e revisões de prioridades. |
| EMP-03 | Oficina Pantanal | Assistência administrativa; atividades e expectativas parcialmente documentadas. |

### Vagas

| ID | Vaga | Empresa | Inscrições iniciais |
| --- | --- | --- | --- |
| VAG-01 | Assistente de Logística | EMP-01 | ANA, BRUNO, CARLA, DIEGO |
| VAG-02 | Assistente de Estoque | EMP-02 | ANA, ELISA, FABIO |
| VAG-03 | Assistente Administrativo | EMP-03 | CARLA, GABRIELA, HUGO |

Total inicial: **3 empresas, 3 vagas, 8 talentos únicos e 10 candidaturas**. Ana e Carla já possuem duas candidaturas fictícias autorizadas. Isso demonstra reutilização sem exigir construir um marketplace ou compartilhamento automático entre empresas.

### Talentos e situações para a história

| ID | Pessoa fictícia | Informações importantes |
| --- | --- | --- |
| ANA | Ana Ribeiro | Relata conferência de pedidos em comércio; quer aprender estoque; espera orientação inicial. A disponibilidade da vaga 2 ainda precisa de reconfirmação. |
| BRUNO | Bruno Costa | Experiência declarada em logística; preferência por autonomia; interesse em atividades de estoque não informado. |
| CARLA | Carla Mendes | Experiência administrativa; operação de planilha exigida na vaga 1 não verificada; participa também da vaga 3. |
| DIEGO | Diego Alves | Experiência relacionada a expedição; informação antiga de disponibilidade entra em conflito com um registro mais recente. |
| ELISA | Elisa Martins | Relata controle de materiais e interesse em estoque; possui avaliação externa fictícia identificada, sem converter sua escala em nota global. |
| FABIO | Fábio Lima | Experiência de atendimento; há informação insuficiente sobre conferência de pedidos. |
| GABRIELA | Gabriela Souza | Experiência em organização de documentos; expectativas profissionais disponíveis. |
| HUGO | Hugo Santos | Experiência em apoio administrativo; contexto organizacional da vaga ainda insuficiente para comparação. |

Defina para cada vaga uma lista pequena e explícita de critérios. Para a vaga 1, use oito: conferência de pedidos, registro em planilha, disponibilidade no turno, interesse nas atividades, expectativa de aprendizado, apoio inicial, autonomia e comunicação de prioridades. Marque quais são obrigatórios e quem confirmou cada requisito.

Preencha evidências suficientes para uma experiência rica sem inventar dados clínicos ou inferências pessoais. Um registro pode sustentar mais de um critério, mas cada vínculo deve ser justificável. Especifique previamente quais células estão alinhadas, em dúvida, em divergência ou sem informação.

Para a demonstração, mantenha também uma solicitação de reconfirmação de disponibilidade para Ana na vaga 2 e uma dúvida sobre a disponibilidade de Diego. Respostas são preparadas e revisáveis, não sorteadas.

## 9. Roteiro principal da demonstração

### Cena 1 — O analista encontra um processo que precisa de atenção

Entrar como analista IEL. A visão geral mostra a base demo e destaca a vaga 1. Abrir a mesa de seleção, com quatro candidaturas e informações vindas de fontes diferentes.

### Cena 2 — A integração se torna visível

Abrir Ana. Mostrar a experiência originada do currículo, a expectativa registrada anteriormente pelo IEL e o contexto da equipe vindo da empresa. Clicar numa conclusão e abrir a fonte. Não pedir à Ana para preencher tudo novamente.

### Cena 3 — A comparação ajuda a pensar

Selecionar Ana e Bruno. Mostrar que há evidências técnicas relevantes para ambos, mas as informações sobre expectativas e contexto não são iguais. Pedir a síntese simulada da IA. Ela aponta que a disponibilidade de orientação na equipe ainda não foi confirmada.

### Cena 4 — Uma dúvida vai para a pessoa certa

Criar a pergunta ao gestor: “Quem poderá orientar a pessoa nas primeiras atividades e em quais horários?” Abrir a visão do destinatário. Resposta fictícia do gestor: “No turno desta vaga não haverá acompanhamento inicial; precisamos de alguém que já execute a rotina com independência.”

Voltar ao analista e incorporar a resposta. O critério deixa de ser desconhecido e passa a mostrar uma diferença entre a expectativa de Ana e a condição informada. A candidatura não é rejeitada automaticamente. O contador de solicitações muda e a análise registra a origem da atualização.

### Cena 5 — O mesmo perfil tem outra leitura em outra vaga

Abrir a candidatura já existente de Ana na vaga 2. O perfil profissional é o mesmo, mas a empresa B oferece orientação. A diferença do contexto muda a análise. A disponibilidade ainda está pendente: não apresentar Ana como pronta para encaminhamento sem esclarecer isso.

Abrir o esclarecimento de Ana, confirmar a disponibilidade fictícia e incorporar a resposta. Mostrar que só uma informação foi complementada para essa oportunidade.

### Cena 6 — A decisão é preparada e compartilhada

Adicionar Ana à lista da vaga 2, revisar as informações e registrar o encaminhamento. Entrar como gestor da empresa B e indicar “Quero entrevistar”. Voltar ao IEL e mostrar o histórico atualizado.

Resultado: a pessoa que demonstrou viu integração, comparação contextual, esclarecimento direcionado, reaproveitamento e encaminhamento. Nenhuma contratação foi automatizada.

### Roteiro curto para apresentação de três minutos

Abrir vaga 1 → comparar Ana/Bruno → mostrar uma evidência → esclarecer apoio com o gestor → abrir Ana na vaga 2 → mostrar contexto diferente → registrar encaminhamento previamente preparado. Os passos abreviados devem ter estado válido, com respostas já disponíveis no cenário curto; não pular validações silenciosamente.

## 10. Estado do protótipo e interações obrigatórias

Um mock aceitável tem dados fictícios e comportamento real de interface. Não basta um botão exibir “Sucesso” e deixar todo o resto igual.

- Busca e filtros afetam linhas, contadores e estados vazios.
- Seleção de comparação permite adicionar/remover e tem limite visível.
- Lista de encaminhamento é separada da comparação e não duplica candidaturas.
- Solicitação criada aparece na lista e no perfil afetado.
- Resposta incorporada altera apenas critérios realmente afetados.
- Encaminhamento usa snapshot das informações compartilhadas; novas notas internas não aparecem retroativamente para a empresa.
- Retorno do gestor atualiza histórico e estado da candidatura.
- Repetir um recebimento simulado não cria duplicatas.
- Alternar persona respeita os recortes de dados da experiência.
- Recarregar a página preserva o progresso local, quando viável.
- “Reiniciar demonstração” restaura a base inicial após confirmação.

Uma implementação simples pode usar fixtures tipadas, repositório mock e estado client-side persistido em localStorage com versão de schema. Se fizer isso, isole a leitura do browser para evitar divergência de hidratação e não armazene segredos ou dados reais. Outra estratégia é aceitável se mantiver o fluxo consistente.

Não misturar leituras estáticas no servidor com alterações locais que nunca chegam às outras telas. Escolha uma estratégia coerente para todo o percurso demo, preservando as convenções do Arki no restante da aplicação.

### Estados secundários a prever

Lista vazia após filtro; fonte indisponível; registro não encontrado; candidato sem avaliação; conflito entre fontes; solicitação cancelada; texto de justificativa vazio; envio simulado em andamento; tentativa repetida de encaminhamento; resposta “não sei”; acesso fora do escopo da persona; reset da demonstração.

Use skeletons e feedback de ações onde fizer sentido. Não adicionar longos delays para fingir inteligência artificial.

## 11. Estrutura de dados sugerida

Os nomes abaixo são conceituais. Adapte ao projeto sem criar um framework genérico desnecessário.

| Entidade | Responsabilidade |
| --- | --- |
| Empresa | Organização atendida pelo IEL. |
| Equipe | Contexto de trabalho dentro da empresa. |
| Vaga | Oportunidade de origem externa, requisitos e vínculo à equipe. |
| Talento | Perfil profissional único, com informações compartilháveis autorizadas. |
| Candidatura | Relação entre talento e vaga; etapa e identificador externo. |
| Evidência | Informação, origem, data, natureza, escopo de visibilidade e referência ao registro. |
| Avaliação existente | Resultado de origem, metodologia e escala preservadas. |
| Critério da vaga | Pergunta de análise, obrigatoriedade e dimensão. |
| Análise | Estado por critério, evidências relacionadas e lacunas. |
| Esclarecimento | Pergunta, destinatário, candidatura/equipe relacionada, resposta e estado. |
| Encaminhamento | Vaga, candidatos, justificativas, snapshot compartilhado e destinatário. |
| Evento do histórico | Ação, autor/persona, momento e entidade afetada. |
| Fonte de dados | Tipo de origem, status simulado e atualização. |

Identificação externa deve considerar sistema, conta/empresa e ID, não apenas um número global. A mesma pessoa pode aparecer em processos distintos, mas suas notas de avaliação internas pertencem ao contexto correspondente.

Separe três estados que não são equivalentes: etapa oficial recebida do sistema de recrutamento, estado local da análise e estado do encaminhamento. Por exemplo, “análise pronta” não significa que a plataforma externa moveu a candidatura.

## 12. Orientação visual e de experiência

Queremos uma ferramenta profissional de trabalho diário. Priorize leitura, hierarquia, densidade útil e consistência. Não transformar a interface numa coleção de cards grandes com pouco conteúdo.

- Use o design system existente e seus tokens como ponto de partida.
- Dê mais espaço à matriz de seleção, às evidências e à comparação.
- Use tabelas para dados comparáveis, painéis laterais para evidências e gráficos apenas para perguntas agregadas.
- Mantenha contexto de empresa e vaga durante a navegação.
- Preserve filtros ao abrir detalhe e voltar, sempre que possível.
- Use linguagem em português brasileiro, com termos compreensíveis para o analista.
- Diferencie “sem informação” de “divergência” com texto e ícones, não só cores.
- Não usar brilho, avatares de robôs ou animações decorativas como substitutos de análise.
- Evite gráfico radar de personalidade ou mapa de afinidade sem significado verificável.
- Nenhum gráfico deve conter séries inventadas fora da base demo.
- Desktop é prioritário para análise; a experiência de esclarecimento deve funcionar bem no celular.
- Foco de teclado visível, campos rotulados, contraste legível, dialogs acessíveis e tabelas com cabeçalhos.
- Botões devem ter verbos concretos: “Ver evidência”, “Comparar”, “Solicitar esclarecimento”, “Adicionar à lista”, “Registrar encaminhamento”.

A identificação “Dados fictícios — demonstração” pode ser discreta e persistente. Não espalhar explicações de infraestrutura nas telas de RH; detalhes de integração pertencem à área de fontes ou à documentação.

## 13. Como aproveitar o Arki existente

O boilerplate já está em `app/`, dentro deste projeto. Ele é um repositório Git próprio dentro do workspace; respeite as duas raízes e não altere metadados Git ou a organização dos repositórios sem necessidade.

Antes de implementar, leia `app/AGENTS.md`, `app/CLAUDE.md` e `app/apps/dashboard/AGENTS.md`, além das instruções aplicáveis ao diretório que editar. Inspecione o estado atual e preserve mudanças do usuário.

A inspeção inicial encontrou:

- Bun e Turborepo.
- Dashboard em `app/apps/dashboard`, com Next.js 15 e React 19.
- Componentes compartilhados em `app/packages/ui` e gráficos em `app/packages/charts`.
- Autenticação em `app/packages/auth`, banco em `app/packages/database` e rotas em `app/packages/routes`.
- Padrões locais para features, leitura de dados, actions, tabelas e autenticação em layouts.
- Aplicação separada de exemplo de AI Chat em `app/apps/ai-chat`.

Use a estrutura existente. As instruções do dashboard indicam importações pelo pacote raiz `@workspace/ui`, tabelas com TanStack Table e rotas centralizadas. Confirme os componentes disponíveis antes de criar substitutos ou instalar outra biblioteca.

O dashboard proíbe incorporar o aplicativo genérico AI Chat. O assistente contextual de seleção descrito aqui pode ser um componente de análise com respostas mock, sem importar aquele app, suas rotas ou uma experiência aberta de chat. Não é necessário chamar um LLM nesta etapa.

A base inclui exemplos de eventos, cobrança e outras funcionalidades. Ajuste a navegação da experiência IEL para o domínio correto sem apagar arbitrariamente módulos ou pacotes compartilhados. Não gastar a entrega configurando checkout, marketing ou gateway de pagamento.

Não executar scripts de limpeza destrutivos nem atualizar todas as dependências. Não criar migrações reais apenas para persistir o demo se um repositório mock resolver. Não alterar globalmente a autenticação para viabilizar a apresentação. Se o demo precisar de entrada sem serviços externos, mantenha-a isolada, com dados sintéticos e sem acesso às rotas de produção.

Organize o domínio IEL de modo que a fonte mock possa ser substituída por serviços reais depois. Isso requer limites simples entre dados, análise e interface, não uma arquitetura de conectores completa nesta fase.

## 14. Ordem de implementação

### Etapa A — Base navegável

Inspecionar o Arki; definir entrada demo; criar entidades, fixtures e estado; montar navegação e lista de vagas. Garantir contagens iniciais e relações entre empresas, vagas, talentos e candidaturas.

### Etapa B — Núcleo da seleção

Construir mesa da vaga, perfil consolidado, evidências, comparação e síntese contextual mock. Concluir esse percurso antes de investir em gráficos secundários.

### Etapa C — Jornada de decisão

Construir solicitações, respostas do gestor/candidato, atualização da análise, lista de encaminhamento e visão da empresa. A demonstração deve funcionar de ponta a ponta.

### Etapa D — Visão integrada e acabamento

Completar indicadores calculados, fontes de dados, atualização idempotente simulada, estados vazios/erro, responsividade e reset. Revisar texto e coerência entre telas.

Não entregar apenas a etapa A e chamar o produto de completo. O objetivo inclui o percurso inteiro. Se alguma infraestrutura impedir o backend real, mantenha a execução mock do fluxo e explique a limitação.

## 15. Verificação e critérios de aceite

Use os comandos reais do projeto, inspecionados antes da execução. Rode verificações de tipos/lint pertinentes e valide a jornada no navegador. Um teste de fluxo cobrindo o percurso principal e verificações pontuais de regras de estado têm valor maior do que testes superficiais de cada card.

A entrega está pronta quando:

- [ ] A entrada demo abre sem precisar configurar APIs de terceiros ou fornecer dados reais.
- [ ] As contagens iniciais são 3 empresas, 3 vagas, 8 talentos e 10 candidaturas.
- [ ] Lista, filtros, detalhe e comparação usam a mesma base.
- [ ] Uma pessoa com duas candidaturas continua sendo um único talento.
- [ ] Ana e Bruno podem ser comparados no contexto da vaga 1.
- [ ] Conclusões relevantes abrem suas evidências e identificam lacunas.
- [ ] A pergunta ao gestor pode ser criada, respondida e incorporada à análise.
- [ ] A atualização afeta a análise de Ana sem rejeitá-la automaticamente.
- [ ] A candidatura de Ana à vaga 2 utiliza seu perfil existente e permite esclarecer a disponibilidade.
- [ ] É possível preparar e registrar um encaminhamento da vaga 2.
- [ ] O gestor da empresa B vê apenas o conteúdo compartilhado e registra interesse em entrevista.
- [ ] O IEL vê o retorno e o histórico da ação.
- [ ] Solicitações e indicadores mudam de acordo com o estado, sem números decorativos.
- [ ] Repetir uma atualização simulada não duplica registros.
- [ ] O ambiente diferencia ações locais simuladas de sincronização externa real.
- [ ] A experiência de esclarecimento funciona em largura de celular e com teclado.
- [ ] Reiniciar o demo restaura um estado consistente.
- [ ] Nenhum botão central é meramente decorativo.

Não afirmar ganhos de contratação a partir do mock. A demonstração prova a experiência proposta e a capacidade de organizar a informação, não redução real de rotatividade ou validade preditiva de avaliações.

## 16. Fontes e referências

### Fonte principal do problema

Leia os arquivos em `docs/enunciado/`, relativos à raiz deste workspace. Se estiver trabalhando dentro de `app/`, a pasta de referência está em `../docs/enunciado/`.

Priorize:

- [Desafio e contexto](enunciado/01-desafio-e-contexto.md).
- [Causas do problema](enunciado/02-causas-do-problema.md).
- [Critérios de resolução](enunciado/06-problema-considerado-resolvido.md).
- [Experiência existente e limitações](enunciado/07-ja-sabemos-que.md).
- [Restrições](enunciado/09-restricoes.md).
- [Usuários](enunciado/10-quem-usara-a-solucao.md).
- [Integração](enunciado/11-sobre-integracao.md).
- [Exigências](enunciado/12-exigencias-tecnicas-normativas-regulatorias.md).

Existe também o PDF original `docs/Desafio IEL.pdf`. Não atribuir ao enunciado detalhes de operação ou funcionalidades que foram escolhas nossas.

### Referências de produto pesquisadas

Estas fontes documentam capacidades anunciadas. Não comprovam sozinhas eficácia, ausência de vieses ou exclusividade. O objetivo é combinar práticas úteis para a operação do IEL, não afirmar que inventamos todas as funcionalidades.

| Referência | O que inspira ou esclarece |
| --- | --- |
| [Moka — China](https://www.mokahr.com/solution/ai) | Estruturação de perfis de vaga/talento, matching e reaproveitamento da base. |
| [Beisen — China](https://www.beisen.com/res/2618.html) | Aprofundamento contextual e relação entre avaliação e evidências; usar isso como referência para esclarecimentos pontuais. |
| [AssessFirst](https://www.assessfirst.com/en/solutions/manager-collaborator-fit-engine) | Contexto da relação com gestor/equipe; não copiar nem alegar reproduzir sua metodologia psicométrica. |
| [Sapia — plataforma](https://sapia.ai/platform/) | Entrevistas, análises e integração já existem; chatbot não deve ser nossa única proposta de valor. |
| [Sapia — reaproveitamento](https://help.sapia.ai/en/articles/9245402-i-am-trying-to-apply-to-multiple-roles-with-a-company-why-am-i-not-getting-a-new-interview-link) | Reduzir repetição de coleta é uma prática existente, com condições de uso. |
| [Harver](https://harver.com/solutions/use-case/assessment-solution-software/) | Avaliações e prévias da rotina são referências, mas não entram no escopo deste protótipo. |
| [Empregare — IA](https://www.empregare.com/es-cl/business/inteligencia-artificial) | Funcionalidades anunciadas pelo fornecedor atual; evitar reproduzir entrevista automatizada como centro. |
| [Empregare — integrações](https://www.empregare.com/pt-br/business/por-que-investir) | Anúncio de API/webhooks; acesso e cobertura para o IEL ainda dependem de confirmação. |
| [Gupy — eventos](https://developers.gupy.io/reference/webhooks) | Referência de como candidaturas e vagas podem gerar notificações para sistemas integrados. |
| [Arki](https://www.usearki.dev/en) | Base de infraestrutura; nesta implementação, o código local é a referência principal para padrões técnicos. |

Não é necessário fazer uma nova pesquisa de mercado antes de começar o protótipo. Use essas referências para entender a origem das escolhas, mantendo a dor do IEL como guia da implementação.

## 17. O que entregar ao usuário

Implemente a experiência, verifique o percurso e entregue:

1. Código do protótipo no Arki, com dados demo e estado consistente.
2. Instruções exatas para executar e acessar a demonstração.
3. Explicação curta das telas e do roteiro principal.
4. Identificação do que é simulado e do que seria conectado posteriormente.
5. Resumo das verificações realizadas e eventuais limitações reais.

A pessoa que abrir o produto deve entender, sem ler este documento inteiro: **o IEL recebe informações de processos existentes, reúne evidências, compara candidatos no contexto de cada vaga, esclarece o que falta e prepara uma decisão compartilhada com a empresa.**

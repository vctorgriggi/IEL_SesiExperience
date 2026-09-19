# Central de Compatibilidade IEL

> Conhecer o talento, entender cada equipe e aproveitar esse conhecimento nas próximas oportunidades.

## A ideia

Uma aplicação web que reúne experiências, interesses e expectativas do candidato e as condições reais de trabalho de cada equipe. A IA ajuda a construir esses perfis por conversa, esclarece informações ausentes e explica as conexões entre talentos e oportunidades.

O perfil do talento pode ser atualizado e reaproveitado em novas candidaturas, com seu controle sobre o compartilhamento. O contexto da equipe também é reutilizado nas vagas relacionadas. O IEL consegue analisar novas conexões sem reiniciar toda a coleta de informações.

A proposta combina **perfil reutilizável, contexto da equipe, análise dos dois lados e encaminhamento entre oportunidades do IEL**. O valor esperado está em reduzir perguntas repetidas e consolidação manual, ampliando a análise além dos requisitos técnicos.

## Onde cada pessoa entra

| Pessoa        | Interface                                                         | O que faz                                                                                |
| ------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Candidato     | Página pelo celular, acessada por link individual protegido       | Conversa com a IA, revisa seu perfil, conhece a vaga e autoriza novos compartilhamentos. |
| Gestor        | Página da equipe/vaga no painel da empresa                        | Explica a rotina, confirma o contexto e responde a dúvidas relevantes.                   |
| RH da empresa | Painel com suas vagas e candidaturas                              | Acompanha a etapa, consulta análises e decide os próximos passos.                        |
| IEL           | Painel das oportunidades e perfis aos quais tem acesso autorizado | Acompanha processos e identifica possíveis conexões entre empresas.                      |

Cada empresa acessa apenas as informações autorizadas para seus processos. O encaminhamento para outra empresa não compartilha avaliações internas ou informações confidenciais da primeira.

## Jornada: da vaga à decisão

1. **Publicação no sistema original.** O RH publica a vaga no Empregare ou no sistema de recrutamento que já utiliza. Nossa aplicação recebe a vaga pela integração configurada.
2. **Preparação com o gestor.** Pelo painel, o RH gera um convite. O gestor abre a página da vaga, conversa com a IA e confirma atividades, autonomia, acompanhamento, feedback e possibilidades de aprendizado. Contextos existentes podem ser revisados e reaproveitados.
3. **Candidatura e convite.** O candidato se inscreve no sistema original. A integração informa a candidatura ou a chegada à etapa escolhida pelo RH. Nossa aplicação vincula empresa, vaga e candidatura e dispara o convite pelo canal configurado, inicialmente e-mail.
4. **Conversa complementar.** O candidato abre o link no navegador. A IA aproveita as informações autorizadas já disponíveis e pergunta o que falta para aquela oportunidade. Ele revisa o resumo antes de compartilhá-lo. WhatsApp pode ser um canal futuro de convite; a conversa inicial acontece na aplicação.
5. **Análise de compatibilidade.** Com os perfis confirmados, o sistema apresenta alinhamentos, diferenças e lacunas. Perguntas pendentes vão para quem pode respondê-las. Ausência de informação não vira incompatibilidade automática.
6. **Decisão humana.** RH e gestor consultam a análise e escolhem o encaminhamento. O andamento oficial da seleção permanece no sistema original; devolver a análise ou seu link depende do conector disponível.
7. **Outra oportunidade, se fizer sentido.** Com autorização do candidato, o IEL pode reutilizar seu perfil em outro processo. A plataforma confirma mudanças e coleta apenas os complementos necessários.

## Funcionalidades centrais

### Perfil reutilizável do talento

Organiza experiências declaradas, interesses, expectativas e preferências profissionais. Cada informação mantém origem, data e possibilidade de correção. Dados que podem mudar, como disponibilidade, precisam de reconfirmação.

**Exemplo:** “Eu ajudava na loja da minha tia.” A IA pergunta o que a pessoa fazia e identifica relatos de conferência de pedidos e resolução de divergências. O candidato confirma a descrição; isso não se torna uma competência comprovada automaticamente.

### Retrato da equipe e da vaga

Transforma descrições genéricas em condições concretas. Mantém um contexto da equipe e requisitos específicos de cada função.

**Exemplo:** diante de “precisamos de autonomia”, a IA pergunta quais decisões o recém-contratado poderá tomar sozinho e quem estará disponível para ajudá-lo.

### Compatibilidade nos dois sentidos

Compara o que a pessoa pode oferecer com as atividades da vaga e o que a oportunidade oferece com o que ela procura. Trata aspectos de fit cultural por situações de trabalho, como acompanhamento, comunicação e tomada de decisão. Não infere personalidade por aparência ou voz, nem usa dados de saúde na seleção.

**Exemplo:** há experiência relacionada à função, mas a pessoa espera orientação inicial e a equipe prevê trabalho independente desde o primeiro dia. A diferença fica explícita para esclarecimento.

### Perguntas e condições para avançar

A IA identifica informações relevantes ausentes e cria perguntas direcionadas. Condições negociáveis só mudam após confirmação dos envolvidos; requisitos obrigatórios continuam visíveis.

**Exemplo:** “Existe alguém disponível para acompanhar as primeiras atividades?” A resposta do gestor atualiza a análise e é apresentada ao candidato.

### Análise explicada e novas conexões

Apresenta evidências, expectativas, pontos de atenção e perguntas para a entrevista. Pode sugerir outra oportunidade na rede autorizada do IEL, explicando por que merece ser considerada, sem inscrever ou compartilhar o perfil automaticamente.

**Exemplo:** uma vaga exige horário incompatível; outra tem atividades relacionadas e horário adequado. O candidato escolhe se deseja explorar a alternativa.

## Exemplo completo: Ana e duas empresas

Cenário fictício: Ana se candidata a uma vaga de logística da empresa A. Na conversa, relata que conferia pedidos em um comércio, quer aprender controle de estoque e prefere orientação durante a adaptação.

| Dimensão                     | Empresa A                                         | Empresa B                                      |
| ---------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| Atividades                   | Conferência de pedidos                            | Conferência de pedidos e apoio ao estoque      |
| Acompanhamento inicial       | Trabalho independente; apoio ainda não confirmado | Colega de referência disponível no início      |
| Aprendizado desejado por Ana | Atividades de estoque não informadas              | Contato com controle de estoque confirmado     |
| Próximo passo sugerido       | Esclarecer apoio e atividades                     | Verificar demais requisitos e interesse de Ana |

A IA pergunta ao gestor A sobre apoio inicial. Ele confirma que não haverá acompanhamento. Ana recebe essa informação e pode decidir, junto ao processo humano, se deseja continuar.

O IEL identifica a vaga B como uma possibilidade. Ana conhece a oportunidade e autoriza compartilhar seu perfil. A plataforma confirma sua disponibilidade para o horário de B, que ainda não havia sido verificada. O RH de B recebe as informações autorizadas e decide se a convida para entrevista.

**A demonstração mostra uma conversa alimentar duas análises contextualizadas, revelar uma diferença e abrir outra possibilidade sem repetir toda a avaliação.**

## Integração e recorte do hackathon

O produto é projetado para diferentes sistemas, com um conector por plataforma. Ser independente da origem não significa ter acesso automático a todas elas.

A Empregare anuncia API e webhooks; os eventos, campos e permissões disponíveis ao IEL precisam ser confirmados. A Gupy documenta eventos de candidatura e fluxos de mensageria. O fluxo equivalente no InfoJobs Brasil ainda não foi confirmado nesta pesquisa. Consulta periódica por API pode ser alternativa quando autorizada e suportada; importação manual é contingência, não o fluxo desejado de produção.

**MVP:** duas empresas, duas vagas e um candidato fictícios; preparação dos contextos, conversa por texto, revisão do perfil, análises explicadas e autorização para a segunda oportunidade. A chegada das candidaturas e o envio do convite podem ser simulados e identificados como tais. A IA organiza relatos e formula esclarecimentos; critérios explícitos e informações confirmadas sustentam a comparação.

Na apresentação, mostrar quais informações foram reaproveitadas, quais perguntas foram necessárias e como cada resposta alterou a análise. Economia em produção e melhoria das contratações dependem de validação posterior.

## Referências que inspiram a combinação

As fontes abaixo descrevem capacidades anunciadas pelos fornecedores. Servem como referências de produto, não como comprovação independente dos resultados nem como afirmação de exclusividade da nossa proposta.

| Referência                                                                                                                                                                       | Inspiração para a solução                                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Moka — China](https://www.mokahr.com/solution/ai)                                                                                                                               | Perfis de candidatos e vagas, matching e reaproveitamento da base de talentos.                                                                                                    |
| [Beisen — China](https://www.beisen.com/res/2618.html)                                                                                                                           | Perguntas de aprofundamento e análises associadas a evidências comportamentais.                                                                                                   |
| [AssessFirst](https://www.assessfirst.com/en/solutions/manager-collaborator-fit-engine)                                                                                          | Consideração da relação entre candidato e gestor no contexto de trabalho.                                                                                                         |
| [Sapia — reutilização de entrevistas](https://help.sapia.ai/en/articles/9245402-i-am-trying-to-apply-to-multiple-roles-with-a-company-why-am-i-not-getting-a-new-interview-link) | Redução de repetição: documenta reutilização em funções semelhantes da mesma empresa, sob condições específicas. Nossa proposta de rede entre empresas exige autorização própria. |
| [Empregare — IA](https://www.empregare.com/es-cl/business/inteligencia-artificial)                                                                                               | Já anuncia entrevistas por IA; nossa proposta precisa agregar valor na jornada e no reaproveitamento das informações.                                                             |
| [Empregare — integrações](https://www.empregare.com/pt-br/business/por-que-investir) e [Gupy — eventos](https://developers.gupy.io/reference/webhooks)                           | Referências para receber vagas/candidaturas e conectar a etapa ao processo existente, conforme os recursos autorizados.                                                           |

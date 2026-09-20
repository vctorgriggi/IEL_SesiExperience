/**
 * O registro dos tours: uma entrada por tela.
 *
 * É aqui, e só aqui, que se mexe para mudar o que o tour diz. Acrescentar uma
 * tela ao tour é acrescentar um objeto nesta lista; o diálogo do cabeçalho se
 * monta sozinho a partir dela, na ordem em que as entradas aparecem.
 *
 * Os textos seguem a mesma régua do resto do produto (docs/DESIGN.md): uma
 * pergunta por tela, um número, uma ação, sem jargão. E nenhum passo promete
 * o que o produto não faz — o tour é leitura da tela, não argumento de venda.
 *
 * A primeira entrada, "A jornada inteira", é o roteiro da apresentação: ela
 * atravessa as telas na ordem em que o trabalho acontece. Quando uma tela
 * nova entra no produto, é nela que a tela precisa aparecer — senão a
 * demonstração continua contando o produto de antes.
 */

import {
  IconArrowRight,
  IconBriefcase,
  IconBuilding,
  IconChartBar,
  IconClipboardList,
  IconHeartHandshake,
  IconHome,
  IconListCheck,
  IconPlug,
  IconSend,
  IconUser,
  IconUsers
} from '@tabler/icons-react';

import { routes } from '@workspace/routes';

import type { TourDeTela } from './types';

const iel = routes.dashboard.iel;

/** O alvo de um passo, pela convenção `data-tour`. */
function alvo(nome: string): string {
  return `[data-tour="${nome}"]`;
}

export const TOURS: TourDeTela[] = [
  {
    id: 'jornada',
    titulo: 'A jornada inteira',
    descricao:
      'O roteiro da apresentação: da fila do dia ao retorno da empresa',
    icone: IconArrowRight,
    rota: iel.index,
    roteiro: true,
    casaCom: () => false,
    passos: [
      {
        rota: iel.index,
        seletor: alvo('inicio-fila'),
        titulo: 'O que precisa de mim hoje',
        texto:
          'A fila abre o dia na ordem em que compensa resolver: pergunta sem resposta, currículo para enviar, contratado para ligar. Cada linha leva à tela onde aquilo se resolve.',
        lado: 'right'
      },
      {
        rota: iel.index,
        seletor: alvo('inicio-funil'),
        titulo: 'Onde o processo perde gente',
        texto:
          'Do currículo recebido a quem ficou 90 dias. O degrau que mais encolhe é a próxima conversa com a empresa.',
        lado: 'left'
      },
      {
        rota: iel.index,
        seletor: alvo('cabecalho-notificacoes'),
        titulo: 'A mesma fila, de qualquer tela',
        texto:
          'O sino repete o que falta fazer sem obrigar a voltar ao início. O que já foi lido fica no navegador de quem leu, não na base: duas pessoas na mesma sala não apagam o aviso uma da outra.',
        lado: 'bottom',
        alinhamento: 'end'
      },
      {
        rota: iel.jobs.byId('VAG-01').index,
        seletor: alvo('mesa-perfil-da-empresa'),
        titulo: 'A mesa de seleção começa pela empresa',
        texto:
          'Trocamos de tela. Antes de olhar candidato, a mesa diz quantos colaboradores da empresa responderam e quantos temas seguem em aberto. Tema sem base não entra na conta de ninguém.',
        lado: 'bottom'
      },
      {
        rota: iel.jobs.byId('VAG-01').index,
        seletor: alvo('mesa-indicadores'),
        titulo: 'A vaga, em quatro números',
        texto:
          'Compatíveis, sem questionário, marcados e resgate — cada cartão é também um filtro da tabela abaixo. "Marcados" trava em 5, que é o teto de currículos por vaga.',
        lado: 'bottom'
      },
      {
        rota: iel.jobs.byId('VAG-01').index,
        seletor: alvo('mesa-tabela'),
        titulo: 'Os dois números, nunca fundidos',
        texto:
          '"Combina" é a aderência ao jeito de trabalhar da empresa; "Requisitos" vem do sistema de vagas. A tensão entre os dois é a informação — e o resgate traz de volta quem o filtro técnico descartou.',
        lado: 'top'
      },
      {
        rota: iel.jobs.byId('VAG-01').index,
        seletor: alvo('mesa-enviar'),
        titulo: 'Marcar e preparar o envio',
        texto:
          'Marque até cinco pessoas e o preparo abre com a mensagem para a empresa e a justificativa de cada perfil, revisáveis antes do registro. Nada sai daqui sozinho: quem decide é você.',
        lado: 'bottom'
      },
      {
        rota: iel.referrals.index,
        seletor: alvo('enviados-tabela'),
        titulo: 'O que a empresa fez com o que recebeu',
        texto:
          'Cada envio guarda o retrato do que saiu e o retorno da empresa: quem foi chamado, quem foi contratado e o que ficou sem resposta. É o que faltava para cobrar retorno sem depender de memória.',
        lado: 'top'
      },
      {
        rota: iel.companies.byId('EMP-01'),
        seletor: alvo('empresa-temas'),
        titulo: 'De onde sai o "combina"',
        texto:
          'A empresa descrita pela própria equipe, tema a tema — não pelo RH. Enquanto o mínimo de respostas não fecha, o tema fica em aberto e não pesa na conta de ninguém.',
        lado: 'top'
      },
      {
        rota: `${iel.companies.byId('EMP-01')}?aba=mapa`,
        seletor: alvo('empresa-mapa'),
        titulo: 'Quem na base combina com esta cultura',
        texto:
          'A mesma leitura na direção inversa: a empresa no centro e as pessoas da base ao redor, inclusive quem ainda não se candidatou. Serve para achar gente para uma vaga que nem abriu.',
        lado: 'top'
      },
      {
        rota: iel.talents.byId('ANA').index,
        seletor: alvo('pessoa-aderencia'),
        titulo: 'A pessoa, e onde ela se encaixa',
        texto:
          'No perfil, a aderência é aba: a mesma conta da mesa, agora com a pessoa no centro e as empresas ao redor. Ao lado ficam como ela prefere trabalhar e as candidaturas dela.',
        lado: 'top'
      },
      {
        rota: `${iel.candidates}?aba=analise`,
        seletor: alvo('questionarios-abas'),
        titulo: 'A ponta do candidato, em duas leituras',
        texto:
          '"Simples" é a lista de quem ainda não respondeu, com reenvio e cobrança. "Análise" é o agregado: nenhum nome, e recorte com menos de cinco pessoas sai como travessão.',
        lado: 'bottom'
      },
      {
        rota: `${iel.candidates}?aba=analise`,
        seletor: alvo('questionarios-funil'),
        titulo: 'Onde o candidato para',
        texto:
          'O ponto de maior abandono diz qual tela precisa de revisão de linguagem — não de mais cobrança. É por isso que o questionário lê a pergunta em voz alta e aceita resposta por número.',
        lado: 'top'
      },
      {
        rota: iel.instrument.index,
        seletor: alvo('instrumento-numeros'),
        titulo: 'As 52 frases, na mão da analista',
        texto:
          'O instrumento é do cliente e fica visível: frase desligada não é perguntada nem pesa, e frase em que quase todo mundo concorda entra no perfil da empresa sem contar na aderência.',
        lado: 'bottom'
      },
      {
        rota: iel.followUp.index,
        seletor: alvo('acompanhamento-fila'),
        titulo: 'A contratação durou?',
        texto:
          'A segunda metade do ciclo, que o IEL nunca teve. O que a pessoa disse e o que a empresa disse, lado a lado — e quando a empresa cala, quem responde é a pessoa.',
        lado: 'top'
      },
      {
        rota: iel.followUp.index,
        seletor: alvo('acompanhamento-privacidade'),
        titulo: 'O que a pessoa diz fica com o IEL',
        texto:
          'A resposta do check-in nunca chega à empresa. Não existe botão nesta tela que compartilhe isso — é o que torna a pergunta possível.',
        lado: 'bottom'
      },
      {
        rota: iel.bi,
        seletor: alvo('bi-reabertura'),
        titulo: 'O indicador que o IEL escolheu',
        texto:
          'Reabertura da mesma vaga, na mesma empresa, em 90 dias. A linha vertical marca a entrada do Mind RH e só meses fechados entram na comparação. Os dados desta tela são simulados, e ela diz isso em faixa.',
        lado: 'top'
      },
      {
        rota: iel.dataSources,
        seletor: alvo('integracoes-campos'),
        titulo: 'O que fica de fora',
        texto:
          'CPF, RG, foto, idade e endereço não entram. Toda conexão nasce no modo mais restrito, e campo novo só entra se alguém do IEL ligar.',
        lado: 'top'
      },
      {
        rota: iel.index,
        seletor: alvo('acoes-rapidas'),
        titulo: 'E o Mind, em qualquer tela',
        texto:
          'De volta ao início: o leque abre a fila do dia, a importação da planilha e o Mind, que responde sobre a tela em que você está. Fim do roteiro — o tour de cada tela continua no mesmo botão do cabeçalho.',
        lado: 'left'
      }
    ]
  },
  {
    id: 'inicio',
    titulo: 'Início',
    descricao: 'O que precisa de você hoje',
    icone: IconHome,
    rota: iel.index,
    casaCom: (pathname) => pathname === iel.index,
    passos: [
      {
        titulo: 'O dia começa aqui',
        texto:
          'Esta tela responde a uma pergunta só: o que precisa de você hoje. Nada aqui é relatório — tudo é coisa a resolver.'
      },
      {
        seletor: alvo('inicio-indicadores'),
        titulo: 'Quatro números do período',
        texto:
          'Vagas ativas, quantos responderam o questionário, quanto as empresas devolveram e quantos continuaram 90 dias. A seta diz se subiu ou caiu.',
        lado: 'bottom'
      },
      {
        seletor: alvo('inicio-fila'),
        titulo: 'A fila de trabalho',
        texto:
          'As pendências na ordem em que compensa resolver: pergunta sem resposta, currículo para enviar, contratado para ligar. Cada linha abre onde se resolve.',
        lado: 'right'
      },
      {
        seletor: alvo('inicio-funil'),
        titulo: 'Onde o processo perde gente',
        texto:
          'Do currículo recebido a quem ficou 90 dias. O degrau que mais encolhe é o que merece a próxima conversa com a empresa.',
        lado: 'left'
      },
      {
        seletor: alvo('cabecalho-notificacoes'),
        titulo: 'A mesma fila, de qualquer tela',
        texto:
          'O sino repete o que falta fazer sem obrigar a voltar para cá. O que já foi lido fica no navegador de quem leu.',
        lado: 'bottom',
        alinhamento: 'end'
      },
      {
        seletor: alvo('acoes-rapidas'),
        titulo: 'O Mind e as ações rápidas',
        texto:
          'O leque abre a fila do dia, a importação da planilha e o Mind, que responde sobre a tela em que você está.',
        lado: 'left'
      }
    ]
  },
  {
    id: 'vagas',
    titulo: 'Vagas',
    descricao: 'Todas as vagas e em que pé cada uma está',
    icone: IconBriefcase,
    rota: iel.jobs.index,
    casaCom: (pathname) => pathname === iel.jobs.index,
    passos: [
      {
        titulo: 'A carteira de vagas',
        texto:
          'A lista de tudo que está aberto, com a empresa, o prazo e quantos currículos já foram marcados para envio.'
      },
      {
        seletor: alvo('vagas-lista'),
        titulo: 'Uma linha por vaga',
        texto:
          'O contador "0 de 5" mostra quanto falta para fechar a remessa. Clique numa vaga para abrir a mesa de seleção dela.',
        lado: 'top'
      }
    ]
  },
  {
    id: 'mesa',
    titulo: 'Mesa de seleção',
    descricao: 'Quem eu envio para esta vaga',
    icone: IconUsers,
    rota: iel.jobs.byId('VAG-01').index,
    casaCom: (pathname) =>
      pathname.startsWith(`${iel.jobs.index}/`) &&
      !pathname.endsWith('/importar') &&
      !pathname.endsWith('/comparar') &&
      !pathname.endsWith('/encaminhamento'),
    passos: [
      {
        titulo: 'A tela onde a decisão acontece',
        texto:
          'Requisitos técnicos e aderência à empresa lado a lado, na mesma tabela. É aqui que se escolhe quem vai.'
      },
      {
        seletor: alvo('mesa-perfil-da-empresa'),
        titulo: 'O que a empresa já respondeu',
        texto:
          'Quantos colaboradores responderam e quantos temas seguem em aberto. Tema sem base não entra na conta de ninguém.',
        lado: 'bottom'
      },
      {
        seletor: alvo('mesa-indicadores'),
        titulo: 'Compatíveis, sem questionário, marcados e resgate',
        texto:
          'Cada cartão é também um filtro da tabela abaixo. "Marcados" trava em 5 — é o teto de currículos por vaga.',
        lado: 'bottom'
      },
      {
        seletor: alvo('mesa-filtros'),
        titulo: 'Quatro recortes da mesma lista',
        texto:
          'Sugeridos traz quem passa do mínimo. Resgate traz quem o filtro técnico jogou para baixo mas combina com a empresa.',
        lado: 'bottom'
      },
      {
        seletor: alvo('mesa-tabela'),
        titulo: 'Os dois números, nunca fundidos',
        texto:
          '"Combina" é a aderência ao jeito de trabalhar da empresa; "Requisitos" vem do sistema de vagas. A tensão entre os dois é a informação.',
        lado: 'top'
      },
      {
        seletor: alvo('mesa-enviar'),
        titulo: 'Marcar e enviar',
        texto:
          'Marque até cinco pessoas e prepare o envio. Nada sai daqui sozinho: quem decide é você.',
        lado: 'bottom'
      }
    ]
  },
  {
    id: 'encaminhamento',
    titulo: 'Preparo do envio',
    descricao: 'A mensagem, a justificativa e o que a empresa vai ver',
    icone: IconSend,
    rota: iel.jobs.byId('VAG-01').referral,
    casaCom: (pathname) => pathname.endsWith('/encaminhamento'),
    passos: [
      {
        titulo: 'Antes de a empresa receber',
        texto:
          'A lista marcada na mesa vira um envio só, com o que sustenta cada nome. Registrar compartilha as informações com a empresa; o sistema de vagas de origem não é alterado.'
      },
      {
        seletor: alvo('encaminhamento-mensagem'),
        titulo: 'A mensagem, sugerida e revisável',
        texto:
          'A análise assistida escreve o texto; quem assina é a analista. Nenhuma palavra sai daqui sem passar por ela.',
        lado: 'bottom'
      },
      {
        seletor: alvo('encaminhamento-registrar'),
        titulo: 'Ver antes de registrar',
        texto:
          'A pré-visualização mostra exatamente o que a empresa vai ler, inclusive quais evidências foram autorizadas. Preparar, encaminhar e contratar são ações diferentes.',
        lado: 'top'
      }
    ]
  },
  {
    id: 'enviados',
    titulo: 'Enviados',
    descricao: 'O que a empresa fez com cada currículo',
    icone: IconSend,
    rota: iel.referrals.index,
    casaCom: (pathname) => pathname.startsWith(iel.referrals.index),
    passos: [
      {
        titulo: 'O retrato de cada envio',
        texto:
          'Cada encaminhamento guarda o que saiu no momento em que saiu: quem foi, com que justificativa e quais evidências.'
      },
      {
        seletor: alvo('enviados-tabela'),
        titulo: 'O retorno da empresa, na mesma linha',
        texto:
          'Chamado para entrevista, contratado, sem resposta. É daqui que sai a cobrança de retorno — e é daqui que a pessoa entra em acompanhamento.',
        lado: 'top'
      }
    ]
  },
  {
    id: 'talentos',
    titulo: 'Banco de talentos',
    descricao: 'As pessoas da base, fora do contexto de uma vaga',
    icone: IconClipboardList,
    rota: iel.talents.index,
    casaCom: (pathname) => pathname === iel.talents.index,
    passos: [
      {
        titulo: 'Todo mundo que já passou pelo IEL',
        texto:
          'O banco inteiro, independente de vaga. Serve para achar alguém pelo nome e para ver onde a pessoa se encaixa.'
      },
      {
        seletor: alvo('talentos-lista'),
        titulo: 'Abrir uma pessoa',
        texto:
          'O perfil mostra a leitura tema a tema, as candidaturas dela e a aderência com a empresa de cada uma.',
        lado: 'top'
      }
    ]
  },
  {
    id: 'pessoa',
    titulo: 'Perfil da pessoa',
    descricao: 'Onde ela se encaixa e como prefere trabalhar',
    icone: IconUser,
    rota: iel.talents.byId('ANA').index,
    casaCom: (pathname) =>
      pathname.startsWith(`${iel.talents.index}/`) &&
      pathname !== iel.talents.index,
    passos: [
      {
        titulo: 'A pessoa, em abas',
        texto:
          'A analista abre uma pessoa para decidir sobre uma vaga: a comparação vem primeiro, e a leitura só dela vem depois.'
      },
      {
        seletor: alvo('pessoa-aderencia'),
        titulo: 'Onde ela se encaixa',
        texto:
          'A mesma conta da mesa de seleção, com a pessoa no centro e as empresas ao redor. Empresa sem base suficiente não é ranqueada.',
        lado: 'top'
      }
    ]
  },
  {
    id: 'empresas',
    titulo: 'Empresas',
    descricao: 'Como se trabalha em cada empresa',
    icone: IconBuilding,
    rota: iel.companies.index,
    casaCom: (pathname) => pathname.startsWith(iel.companies.index),
    passos: [
      {
        titulo: 'O outro lado da conta',
        texto:
          'A aderência compara a pessoa com a empresa. Esta é a tela onde a empresa é descrita — pela própria equipe, não pelo RH.'
      },
      {
        seletor: alvo('empresas-lista'),
        titulo: 'Quantos já responderam',
        texto:
          'Cada empresa mostra o andamento da consulta à equipe. Enquanto o mínimo não fecha, o tema fica em aberto e não pesa.',
        lado: 'top'
      },
      {
        rota: `${iel.companies.byId('EMP-01')}?aba=mapa`,
        seletor: alvo('empresa-mapa'),
        titulo: 'Quem combina com esta cultura',
        texto:
          'Dentro de uma empresa, o mapa é aba: a cultura no centro e as pessoas da base ao redor, inclusive quem ainda não se candidatou.',
        lado: 'top'
      }
    ]
  },
  {
    id: 'acompanhamento',
    titulo: 'Acompanhamento',
    descricao: 'A contratação durou?',
    icone: IconHeartHandshake,
    rota: iel.followUp.index,
    casaCom: (pathname) => pathname === iel.followUp.index,
    passos: [
      {
        titulo: 'A segunda metade do ciclo',
        texto:
          'O IEL nunca soube por que a pessoa saiu. Aqui pergunta aos dois lados — e quando a empresa não responde, quem responde é a pessoa.'
      },
      {
        seletor: alvo('acompanhamento-indicadores'),
        titulo: 'Quem está em acompanhamento',
        texto:
          'Contratados dos últimos 90 dias, quem tem pergunta aberta sem resposta e quantas empresas não deram retorno.',
        lado: 'bottom'
      },
      {
        seletor: alvo('acompanhamento-fila'),
        titulo: 'O que cada lado disse',
        texto:
          'Duas colunas: o que a pessoa contou e o que a empresa informou. Uma nunca sobrescreve a outra.',
        lado: 'top'
      },
      {
        seletor: alvo('acompanhamento-privacidade'),
        titulo: 'O que a pessoa diz fica com o IEL',
        texto:
          'A resposta do check-in nunca chega à empresa. Não existe botão nesta tela que compartilhe isso.',
        lado: 'bottom'
      }
    ]
  },
  {
    id: 'questionarios',
    titulo: 'Questionários',
    descricao: 'Comunicação, resposta e consentimento',
    icone: IconClipboardList,
    // A tela abre na aba Simples; os alvos do tour estão na Análise.
    rota: `${iel.candidates}?aba=analise`,
    casaCom: (pathname) => pathname === iel.candidates,
    passos: [
      {
        titulo: 'A operação do questionário',
        texto:
          'Quantos abriram, quantos concluíram, em quanto tempo e por qual aparelho. É a saúde da ponta do candidato.'
      },
      {
        seletor: alvo('questionarios-abas'),
        titulo: 'Duas leituras da mesma coisa',
        texto:
          '"Simples" é a lista de quem ainda não respondeu, com reenvio e cobrança. "Análise" é o agregado, sem nome nenhum.',
        lado: 'bottom'
      },
      {
        seletor: alvo('questionarios-indicadores'),
        titulo: 'Abertura, conclusão e consentimento',
        texto:
          'O consentimento é registrado com versão e horário, antes da primeira pergunta.',
        lado: 'bottom'
      },
      {
        seletor: alvo('questionarios-funil'),
        titulo: 'Onde o candidato para',
        texto:
          'O ponto de maior abandono diz qual tela precisa de revisão de linguagem — não de mais cobrança.',
        lado: 'top'
      }
    ]
  },
  {
    id: 'instrumento',
    titulo: 'Instrumento',
    descricao: 'As 52 frases do cliente, ligadas ou desligadas',
    icone: IconListCheck,
    rota: iel.instrument.index,
    casaCom: (pathname) => pathname.startsWith(iel.instrument.index),
    passos: [
      {
        titulo: 'O que o produto pergunta',
        texto:
          'As 52 frases do cliente, em 10 temas: é o que candidato e colaborador respondem, e é o que pesa na aderência.'
      },
      {
        seletor: alvo('instrumento-numeros'),
        titulo: 'Quantas estão valendo',
        texto:
          'Frase desligada não é perguntada nem pesa. O que já foi respondido continua guardado; só sai da conta.',
        lado: 'bottom'
      },
      {
        seletor: alvo('instrumento-filtros'),
        titulo: 'Achar a frase e voltar atrás',
        texto:
          'Busca por texto ou por id ("I12"), filtro por tema, e um botão que devolve o instrumento ao do cliente.',
        lado: 'bottom'
      }
    ]
  },
  {
    id: 'bi',
    titulo: 'BI',
    descricao: 'O indicador que mede o resultado',
    icone: IconChartBar,
    rota: iel.bi,
    casaCom: (pathname) => pathname === iel.bi,
    passos: [
      {
        titulo: 'Reabertura de vaga em 90 dias',
        texto:
          'É o indicador que o IEL escolheu: a mesma vaga, na mesma empresa, voltando a abrir. Os dados desta tela são simulados, e ela diz isso em faixa.'
      },
      {
        seletor: alvo('bi-recortes'),
        titulo: 'Três recortes',
        texto:
          'Reabertura, qualidade do match e operação. O período e o setor valem para a tela inteira.',
        lado: 'bottom'
      },
      {
        seletor: alvo('bi-reabertura'),
        titulo: 'Antes e depois',
        texto:
          'A linha vertical marca a entrada do Mind RH. Só meses fechados entram na comparação. As outras duas abas trazem a qualidade do match e a operação.',
        lado: 'top'
      }
    ]
  },
  {
    id: 'integracoes',
    titulo: 'Integrações',
    descricao: 'O que entra, o que sai e o que fica de fora',
    icone: IconPlug,
    rota: iel.dataSources,
    casaCom: (pathname) => pathname === iel.dataSources,
    passos: [
      {
        titulo: 'De onde vêm os dados',
        texto:
          'O sistema de vagas continua sendo a base. O Mind RH lê só o que precisa para dizer quem combina com a empresa.'
      },
      {
        seletor: alvo('integracoes-fluxo'),
        titulo: 'O caminho do dado',
        texto:
          'Do sistema de vagas ao link que a empresa e o candidato recebem. Nenhum passo exige login deles.',
        lado: 'bottom'
      },
      {
        seletor: alvo('integracoes-campos'),
        titulo: 'O que fica desligado',
        texto:
          'CPF, RG, foto, idade e endereço não entram. Toda conexão nasce no modo mais restrito, e campo novo só entra se alguém do IEL ligar.',
        lado: 'top'
      }
    ]
  }
];

/** O tour da tela em que se está, quando existe. */
export function tourDaRota(pathname: string): TourDeTela | null {
  return (
    TOURS.find((tour) =>
      tour.casaCom ? tour.casaCom(pathname) : tour.rota === pathname
    ) ?? null
  );
}

export function tourPorId(id: string): TourDeTela | null {
  return TOURS.find((tour) => tour.id === id) ?? null;
}

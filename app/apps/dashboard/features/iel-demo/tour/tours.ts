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
 */

import {
  IconArrowRight,
  IconBriefcase,
  IconBuilding,
  IconChartBar,
  IconClipboardList,
  IconHeartHandshake,
  IconHome,
  IconPlug,
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
    descricao: 'Da fila do dia ao retorno da empresa — atravessa as telas',
    icone: IconArrowRight,
    rota: iel.index,
    casaCom: () => false,
    passos: [
      {
        rota: iel.index,
        titulo: 'O caminho completo, em sete paradas',
        texto:
          'Este tour anda sozinho pelas telas: começa no dia da analista, passa pela decisão de quem enviar e termina no que a empresa devolveu. Use o "Próximo" — a navegação é por nossa conta.'
      },
      {
        rota: iel.index,
        seletor: alvo('inicio-fila'),
        titulo: '1. O que precisa de mim hoje',
        texto:
          'A fila abre o dia na ordem em que compensa resolver. Cada linha leva à tela onde aquilo se resolve.',
        lado: 'right'
      },
      {
        rota: iel.index,
        seletor: alvo('inicio-funil'),
        titulo: '2. Onde o processo perde gente',
        texto:
          'Do currículo recebido a quem ficou 90 dias. O degrau que mais encolhe é a próxima conversa com a empresa.',
        lado: 'left'
      },
      {
        rota: iel.jobs.byId('VAG-01').index,
        seletor: alvo('mesa-indicadores'),
        titulo: '3. A vaga, em quatro números',
        texto:
          'Trocamos de tela. Compatíveis, sem resposta, marcados e resgate — cada cartão é também um filtro da tabela abaixo.',
        lado: 'bottom'
      },
      {
        rota: iel.jobs.byId('VAG-01').index,
        seletor: alvo('mesa-tabela'),
        titulo: '4. Os dois números, lado a lado',
        texto:
          '"Combina" é a aderência ao jeito de trabalhar da empresa; "Requisitos" vem do sistema de vagas. O resgate traz de volta quem o filtro técnico descartou.',
        lado: 'top'
      },
      {
        rota: iel.companies.byId('EMP-01'),
        seletor: alvo('empresa-temas'),
        titulo: '5. De onde sai o "combina"',
        texto:
          'Outra tela: a empresa descrita pela própria equipe, tema a tema. Enquanto o mínimo de respostas não fecha, o tema fica em aberto e não pesa na conta de ninguém.',
        lado: 'top'
      },
      {
        rota: iel.followUp.index,
        seletor: alvo('acompanhamento-fila'),
        titulo: '6. A contratação durou?',
        texto:
          'A última tela do ciclo. O que a pessoa disse e o que a empresa disse, lado a lado — e quando a empresa cala, quem responde é a pessoa.',
        lado: 'top'
      },
      {
        rota: iel.followUp.index,
        seletor: alvo('acompanhamento-privacidade'),
        titulo: '7. E o que a pessoa diz fica com o IEL',
        texto:
          'A resposta do check-in nunca chega à empresa. É o que torna a pergunta possível.',
        lado: 'bottom'
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
        titulo: 'Compatíveis, sem resposta, marcados e resgate',
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
        seletor: alvo('bi-grafico'),
        titulo: 'Antes e depois',
        texto:
          'A linha vertical marca a entrada do Mind RH. Só meses fechados entram na comparação.',
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

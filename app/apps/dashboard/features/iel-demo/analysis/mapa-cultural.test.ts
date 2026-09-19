import { describe, expect, it } from 'vitest';

import {
  ADHERENCE_THRESHOLD,
  computeAdherence,
  type CandidateAxisValues,
  type CompanyAxisMeans
} from '../analysis/adherence';
import { CULTURE_QUESTIONS, getCultureOptionValue } from '../analysis/culture';
import {
  calcularEncaixeCultural,
  calcularPosicaoCultural,
  classificarCultura,
  compararRespostas,
  CONTRIBUICAO_POR_ALTERNATIVA,
  FAIXA_DE_ENCAIXE_RECOMENDACAO,
  faixaDeAderencia,
  FAIXAS_DE_ADERENCIA,
  MINIMO_DE_EIXOS_PARA_RANQUEAR,
  raioDaAderenciaNoPlano,
  resumirDivergencia,
  temBaseParaRanquear,
  TIPO_DE_CULTURA_TENDENCIA,
  type PosicaoCultural,
  type RespostaDeEixo
} from '../analysis/mapa-cultural';

/**
 * Aderência entre dois conjuntos de respostas pelo motor de `adherence.ts`.
 *
 * O mapa não calcula mais aderência própria, então os testes que precisam de
 * um percentual passam pelo mesmo caminho que a tela.
 */
function resultadoEntre(
  doTalento: RespostaDeEixo[],
  daEmpresa: RespostaDeEixo[]
) {
  const perfil: CompanyAxisMeans = {};
  for (const resposta of daEmpresa) {
    perfil[resposta.axisId] = getCultureOptionValue(
      resposta.axisId,
      resposta.optionId
    );
  }

  const valores: CandidateAxisValues = {};
  for (const resposta of doTalento) {
    const valor = getCultureOptionValue(resposta.axisId, resposta.optionId);
    if (valor !== null) valores[resposta.axisId] = valor;
  }

  return computeAdherence(perfil, valores, {});
}

function aderenciaEntre(
  doTalento: RespostaDeEixo[],
  daEmpresa: RespostaDeEixo[]
): number {
  return resultadoEntre(doTalento, daEmpresa).total ?? 0;
}

function posicao(x: number, y: number): PosicaoCultural {
  return { x, y, eixosRespondidos: [] };
}

describe('mapa cultural — projeção das respostas', () => {
  it('toda alternativa do questionário tem contribuição declarada', () => {
    for (const question of CULTURE_QUESTIONS) {
      for (const option of question.options) {
        expect(
          CONTRIBUICAO_POR_ALTERNATIVA[question.axisId]?.[option.id],
          `${question.axisId} / ${option.id}`
        ).toBeDefined();
      }
    }
  });

  it('calcula a média dos eixos respondidos', () => {
    const respostas: RespostaDeEixo[] = [
      { axisId: 'autonomia', optionId: 'rotina-definida' },
      { axisId: 'comunicacao-prioridades', optionId: 'por-escrito' }
    ];

    const resultado = calcularPosicaoCultural(respostas)!;

    expect(resultado.x).toBeCloseTo(-0.125);
    expect(resultado.y).toBeCloseTo(-1);
    expect(resultado.eixosRespondidos).toEqual([
      'autonomia',
      'comunicacao-prioridades'
    ]);
  });

  it('eixo não respondido não entra na média como zero', () => {
    const umEixo = calcularPosicaoCultural([
      { axisId: 'apoio-inicial', optionId: 'acompanhamento-formal' }
    ])!;

    expect(umEixo.x).toBeCloseTo(-1);
    expect(umEixo.y).toBeCloseTo(-0.5);
    expect(umEixo.eixosRespondidos).toHaveLength(1);
  });

  it('devolve null quando não há resposta nenhuma', () => {
    expect(calcularPosicaoCultural([])).toBeNull();
  });

  it('ignora alternativa fora do questionário em vez de deslocar o ponto', () => {
    const resultado = calcularPosicaoCultural([
      { axisId: 'apoio-inicial', optionId: 'acompanhamento-formal' },
      { axisId: 'apoio-inicial', optionId: 'alternativa-inexistente' }
    ])!;

    expect(resultado.x).toBeCloseTo(-1);
    expect(resultado.eixosRespondidos).toHaveLength(1);
  });
});

describe('mapa cultural — regiões do plano', () => {
  it('classifica cada quadrante', () => {
    expect(classificarCultura(posicao(-0.6, 0.6))).toBe('colaborativa');
    expect(classificarCultura(posicao(0.6, 0.6))).toBe('inovadora');
    expect(classificarCultura(posicao(0.6, -0.6))).toBe('resultados');
    expect(classificarCultura(posicao(-0.6, -0.6))).toBe('estruturada');
  });

  it('não força quadrante no centro do plano', () => {
    expect(classificarCultura(posicao(0.1, -0.1))).toBe('sem-predominancia');
    expect(classificarCultura(posicao(0, 0))).toBe('sem-predominancia');
  });

  it('classifica quem está fora da zona central em apenas um dos eixos', () => {
    expect(classificarCultura(posicao(0.05, 0.9))).toBe('inovadora');
    expect(classificarCultura(posicao(-0.9, 0.05))).toBe('colaborativa');
  });

  it('resolve empate no eixo de foco para o lado de pessoas', () => {
    expect(classificarCultura(posicao(0, -0.9))).toBe('estruturada');
    expect(classificarCultura(posicao(0, 0.9))).toBe('colaborativa');
  });
});

describe('mapa cultural — encaixe', () => {
  it('nomeia a faixa nas bordas exatas', () => {
    expect(calcularEncaixeCultural(posicao(0, 0), posicao(0.5, 0)).faixa).toBe(
      'muito-proximo'
    );
    expect(calcularEncaixeCultural(posicao(0, 0), posicao(1, 0)).faixa).toBe(
      'proximo'
    );
    expect(calcularEncaixeCultural(posicao(0, 0), posicao(1.6, 0)).faixa).toBe(
      'alguma-distancia'
    );
    expect(calcularEncaixeCultural(posicao(0, 0), posicao(1.61, 0)).faixa).toBe(
      'distante'
    );
  });

  it('mede a distância nas duas dimensões', () => {
    const encaixe = calcularEncaixeCultural(posicao(-1, -1), posicao(1, 1));
    expect(encaixe.distancia).toBeCloseTo(Math.sqrt(8));
    expect(encaixe.faixa).toBe('distante');
  });

  it('não depende da ordem dos lados', () => {
    const a = posicao(-0.4, 0.3);
    const b = posicao(0.7, -0.2);

    expect(calcularEncaixeCultural(a, b).distancia).toBeCloseTo(
      calcularEncaixeCultural(b, a).distancia
    );
  });
});

describe('mapa cultural — leitura eixo a eixo', () => {
  it('separa convergência de expectativa a alinhar', () => {
    const leituras = compararRespostas(
      [
        { axisId: 'apoio-inicial', optionId: 'acompanhamento-formal' },
        { axisId: 'ritmo-turno', optionId: 'fixo' }
      ],
      [
        { axisId: 'apoio-inicial', optionId: 'acompanhamento-formal' },
        { axisId: 'ritmo-turno', optionId: 'variacao-frequente' }
      ]
    );

    expect(leituras).toHaveLength(2);
    expect(leituras[0]!.convergente).toBe(true);
    expect(leituras[1]!.convergente).toBe(false);
    expect(leituras[1]!.opcaoDaEmpresa).toContain('demanda');
  });

  it('descarta eixo em que só um lado respondeu', () => {
    const leituras = compararRespostas(
      [{ axisId: 'autonomia', optionId: 'parcial' }],
      [{ axisId: 'ritmo-turno', optionId: 'fixo' }]
    );

    expect(leituras).toHaveLength(0);
  });
});

describe('mapa cultural — resumo de divergência', () => {
  const respostasDaEmpresa: RespostaDeEixo[] = [
    { axisId: 'apoio-inicial', optionId: 'por-conta' },
    { axisId: 'autonomia', optionId: 'rotina-definida' },
    { axisId: 'ritmo-turno', optionId: 'fixo' }
  ];

  const respostasDoTalento: RespostaDeEixo[] = [
    { axisId: 'apoio-inicial', optionId: 'por-conta' },
    { axisId: 'autonomia', optionId: 'autonomia-ampla' },
    { axisId: 'ritmo-turno', optionId: 'variacao-frequente' }
  ];

  function resumoDeExemplo() {
    return resumirDivergencia(
      calcularPosicaoCultural(respostasDoTalento)!,
      calcularPosicaoCultural(respostasDaEmpresa)!,
      compararRespostas(respostasDoTalento, respostasDaEmpresa),
      faixaDeAderencia(aderenciaEntre(respostasDoTalento, respostasDaEmpresa))
    );
  }

  it('nomeia os eixos que divergiram e deixa de fora os que coincidem', () => {
    const resumo = resumoDeExemplo();

    expect(resumo.eixosDivergentes.map((eixo) => eixo.axisId)).toEqual([
      'autonomia',
      'ritmo-turno'
    ]);
    expect(resumo.eixosConvergentes.map((eixo) => eixo.axisId)).toEqual([
      'apoio-inicial'
    ]);
  });

  it('descreve cada lado pela região do plano em que caiu', () => {
    const resumo = resumoDeExemplo();

    expect(resumo.mesmaRegiao).toBe(false);
    expect(resumo.tendenciaDaEmpresa).toBe(
      TIPO_DE_CULTURA_TENDENCIA[resumo.culturaDaEmpresa]
    );
    expect(resumo.tendenciaDoTalento).toBe(
      TIPO_DE_CULTURA_TENDENCIA[resumo.culturaDoTalento]
    );
  });

  it('marca mesma região quando os dois lados caem no mesmo quadrante', () => {
    const iguais = calcularPosicaoCultural(respostasDaEmpresa)!;
    const resumo = resumirDivergencia(
      iguais,
      iguais,
      compararRespostas(respostasDaEmpresa, respostasDaEmpresa),
      faixaDeAderencia(aderenciaEntre(respostasDaEmpresa, respostasDaEmpresa))
    );

    expect(resumo.mesmaRegiao).toBe(true);
    expect(resumo.eixosDivergentes).toHaveLength(0);
    expect(resumo.recomendacao).toBe(
      FAIXA_DE_ENCAIXE_RECOMENDACAO['muito-proximo']
    );
  });

  it('nunca recomenda descarte, nem na faixa mais distante', () => {
    for (const recomendacao of Object.values(FAIXA_DE_ENCAIXE_RECOMENDACAO)) {
      expect(recomendacao).not.toMatch(/descart|elimin|reprov/i);
    }
  });
});

describe('mapa cultural — faixa lida do percentual', () => {
  it('nomeia cada faixa nas bordas exatas', () => {
    expect(faixaDeAderencia(100)).toBe('muito-proximo');
    expect(faixaDeAderencia(85)).toBe('muito-proximo');
    expect(faixaDeAderencia(84.99)).toBe('proximo');
    expect(faixaDeAderencia(65)).toBe('proximo');
    expect(faixaDeAderencia(64.99)).toBe('alguma-distancia');
    expect(faixaDeAderencia(35)).toBe('alguma-distancia');
    expect(faixaDeAderencia(34.99)).toBe('distante');
    expect(faixaDeAderencia(0)).toBe('distante');
  });

  /*
   * O defeito que motivou esta função: a lista mostrava "44% · Muito próximo"
   * e "44% · Alguma distância" em linhas vizinhas, porque o número vinha da
   * aderência por eixo e o rótulo vinha da distância no plano.
   */
  it('mesma aderência nunca produz faixas diferentes', () => {
    const paresComMesmaAderencia: [RespostaDeEixo[], RespostaDeEixo[]][] = [
      [
        [{ axisId: 'autonomia', optionId: 'parcial' }],
        [{ axisId: 'autonomia', optionId: 'parcial' }]
      ],
      [
        [{ axisId: 'ritmo-turno', optionId: 'fixo' }],
        [{ axisId: 'ritmo-turno', optionId: 'fixo' }]
      ],
      [
        [{ axisId: 'aprendizado', optionId: 'ja-domina' }],
        [{ axisId: 'aprendizado', optionId: 'ja-domina' }]
      ]
    ];

    const faixas = paresComMesmaAderencia.map(([talento, empresa]) =>
      faixaDeAderencia(aderenciaEntre(talento, empresa))
    );

    expect(new Set(faixas).size).toBe(1);
  });

  it('abaixo do corte do cliente é sempre a faixa mais distante', () => {
    expect(faixaDeAderencia(ADHERENCE_THRESHOLD - 0.01)).toBe('distante');
    expect(faixaDeAderencia(ADHERENCE_THRESHOLD)).not.toBe('distante');
  });
});

describe('mapa cultural — piso de eixos para ranquear', () => {
  it('recusa posição com menos eixos em comum que o mínimo', () => {
    const umEixo = resultadoEntre(
      [{ axisId: 'autonomia', optionId: 'parcial' }],
      [{ axisId: 'autonomia', optionId: 'parcial' }]
    );

    expect(umEixo.coverage.answeredAxes).toBe(1);
    expect(temBaseParaRanquear(umEixo)).toBe(false);
    // O número continua existindo: o que falta é posição, não aderência.
    expect(umEixo.total).toBe(100);
  });

  it('concede posição a partir do mínimo', () => {
    const respostas: RespostaDeEixo[] = [
      { axisId: 'autonomia', optionId: 'parcial' },
      { axisId: 'ritmo-turno', optionId: 'fixo' }
    ];
    const doisEixos = resultadoEntre(respostas, respostas);

    expect(doisEixos.coverage.answeredAxes).toBe(MINIMO_DE_EIXOS_PARA_RANQUEAR);
    expect(temBaseParaRanquear(doisEixos)).toBe(true);
  });
});

describe('mapa cultural — o raio é a aderência', () => {
  /*
   * A regra que o desenho precisa cumprir, e que a projeção anterior não
   * cumpria: quem tem mais aderência aparece mais perto da empresa. Antes
   * metade dos pares saía invertida, porque a posição vinha dos cinco eixos
   * projetados em duas dimensões e a aderência vinha da medida ponderada.
   */
  it('é monotônica: mais aderência, menos raio, sem exceção', () => {
    const amostras = [0, 12.5, 35, 50, 64.9, 65, 84.9, 85, 99.9, 100];

    for (let i = 1; i < amostras.length; i++) {
      expect(raioDaAderenciaNoPlano(amostras[i]!)).toBeLessThan(
        raioDaAderenciaNoPlano(amostras[i - 1]!)
      );
    }
  });

  it('põe quem tem aderência total no centro, junto da empresa', () => {
    expect(raioDaAderenciaNoPlano(100)).toBe(0);
  });

  it('não empurra ninguém para fora do plano', () => {
    expect(raioDaAderenciaNoPlano(0)).toBeLessThan(1);
  });

  it('os anéis caem nas bordas das faixas', () => {
    for (const faixa of FAIXAS_DE_ADERENCIA) {
      if (!Number.isFinite(faixa.aPartirDe)) continue;
      const raio = raioDaAderenciaNoPlano(faixa.aPartirDe);
      // Um fio para dentro do anel já é a faixa de cima.
      expect(faixaDeAderencia(faixa.aPartirDe)).toBe(faixa.faixa);
      expect(raio).toBeGreaterThan(0);
      expect(raio).toBeLessThan(1);
    }
  });
});

import { describe, expect, it } from 'vitest';

import { CULTURE_QUESTIONS } from '../analysis/culture';
import {
  calcularAderencia,
  calcularEncaixeCultural,
  calcularPosicaoCultural,
  classificarCultura,
  compararRespostas,
  CONTRIBUICAO_POR_ALTERNATIVA,
  CORTE_DE_ADERENCIA,
  FAIXA_DE_ENCAIXE_RECOMENDACAO,
  faixaDeAderencia,
  formatarAderencia,
  MINIMO_DE_EIXOS_PARA_RANQUEAR,
  resumirDivergencia,
  TIPO_DE_CULTURA_TENDENCIA,
  type PosicaoCultural,
  type RespostaDeEixo
} from '../analysis/mapa-cultural';
import { DEMO_CULTURE_ANSWERS } from '../fixtures/culture';

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
      faixaDeAderencia(
        calcularAderencia(respostasDoTalento, respostasDaEmpresa)!.total
      )
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
      faixaDeAderencia(
        calcularAderencia(respostasDaEmpresa, respostasDaEmpresa)!.total
      )
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

describe('mapa cultural — aderência em percentual', () => {
  it('dá 100% quando os dois lados escolhem a mesma alternativa', () => {
    const respostas: RespostaDeEixo[] = [
      { axisId: 'autonomia', optionId: 'rotina-definida' },
      { axisId: 'ritmo-turno', optionId: 'fixo' }
    ];

    const aderencia = calcularAderencia(respostas, respostas)!;

    expect(aderencia.total).toBeCloseTo(1);
    expect(aderencia.eixosComparados).toBe(2);
    expect(aderencia.compativel).toBe(true);
  });

  it('dá 0% no eixo quando escolhem os dois extremos', () => {
    const aderencia = calcularAderencia(
      [{ axisId: 'autonomia', optionId: 'autonomia-ampla' }],
      [{ axisId: 'autonomia', optionId: 'rotina-definida' }]
    )!;

    expect(aderencia.porEixo[0]!.aderencia).toBeCloseTo(0);
    expect(aderencia.total).toBeCloseTo(0);
    expect(aderencia.compativel).toBe(false);
  });

  it('o total é a média simples dos eixos, refazível à mão', () => {
    const aderencia = calcularAderencia(
      [
        { axisId: 'autonomia', optionId: 'rotina-definida' },
        { axisId: 'ritmo-turno', optionId: 'fixo' }
      ],
      [
        { axisId: 'autonomia', optionId: 'rotina-definida' },
        { axisId: 'ritmo-turno', optionId: 'variacao-frequente' }
      ]
    )!;

    const media =
      (aderencia.porEixo[0]!.aderencia + aderencia.porEixo[1]!.aderencia) / 2;
    expect(aderencia.total).toBeCloseTo(media);
  });

  it('ignora eixo que só um lado respondeu e conta o denominador', () => {
    const aderencia = calcularAderencia(
      [
        { axisId: 'autonomia', optionId: 'parcial' },
        { axisId: 'aprendizado', optionId: 'ja-domina' }
      ],
      [{ axisId: 'autonomia', optionId: 'parcial' }]
    )!;

    expect(aderencia.eixosComparados).toBe(1);
    expect(aderencia.porEixo.map((e) => e.axisId)).toEqual(['autonomia']);
  });

  it('devolve null sem eixo comparável, em vez de 0%', () => {
    expect(
      calcularAderencia(
        [{ axisId: 'autonomia', optionId: 'parcial' }],
        [{ axisId: 'ritmo-turno', optionId: 'fixo' }]
      )
    ).toBeNull();
  });

  it('usa o corte de 35% do cliente e aceita outro valor', () => {
    expect(CORTE_DE_ADERENCIA).toBe(0.35);

    const abaixo = calcularAderencia(
      [{ axisId: 'autonomia', optionId: 'autonomia-ampla' }],
      [{ axisId: 'autonomia', optionId: 'rotina-definida' }],
      0
    )!;

    expect(abaixo.compativel).toBe(true);
  });

  it('formata o percentual como inteiro', () => {
    expect(formatarAderencia(0.414)).toBe('41%');
    expect(formatarAderencia(1)).toBe('100%');
  });
});

describe('mapa cultural — faixa lida do percentual', () => {
  it('nomeia cada faixa nas bordas exatas', () => {
    expect(faixaDeAderencia(1)).toBe('muito-proximo');
    expect(faixaDeAderencia(0.85)).toBe('muito-proximo');
    expect(faixaDeAderencia(0.8499)).toBe('proximo');
    expect(faixaDeAderencia(0.65)).toBe('proximo');
    expect(faixaDeAderencia(0.6499)).toBe('alguma-distancia');
    expect(faixaDeAderencia(0.35)).toBe('alguma-distancia');
    expect(faixaDeAderencia(0.3499)).toBe('distante');
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
      faixaDeAderencia(calcularAderencia(talento, empresa)!.total)
    );

    expect(new Set(faixas).size).toBe(1);
  });

  it('abaixo do corte do cliente é sempre a faixa mais distante', () => {
    const abaixo = CORTE_DE_ADERENCIA - 0.01;
    expect(faixaDeAderencia(abaixo)).toBe('distante');
    expect(faixaDeAderencia(CORTE_DE_ADERENCIA)).not.toBe('distante');
  });
});

describe('mapa cultural — piso de eixos para ranquear', () => {
  it('marca base insuficiente com menos eixos que o mínimo', () => {
    const umEixo = calcularAderencia(
      [{ axisId: 'autonomia', optionId: 'parcial' }],
      [{ axisId: 'autonomia', optionId: 'parcial' }]
    )!;

    expect(umEixo.eixosComparados).toBe(1);
    expect(umEixo.baseSuficiente).toBe(false);
    // O número continua existindo: o que falta é posição, não aderência.
    expect(umEixo.total).toBeCloseTo(1);
  });

  it('marca base suficiente a partir do mínimo', () => {
    const respostas: RespostaDeEixo[] = [
      { axisId: 'autonomia', optionId: 'parcial' },
      { axisId: 'ritmo-turno', optionId: 'fixo' }
    ];
    const doisEixos = calcularAderencia(respostas, respostas)!;

    expect(doisEixos.eixosComparados).toBe(MINIMO_DE_EIXOS_PARA_RANQUEAR);
    expect(doisEixos.baseSuficiente).toBe(true);
  });
});

describe('fixtures — cobertura de cultura da empresa padrão', () => {
  /*
   * A Cerrado é a empresa que a tela abre por padrão. Se ela voltar a responder
   * menos eixos, a aderência de todo candidato encolhe junto e a cena do pitch
   * abre na pior cobertura da base.
   *
   * A única lacuna é `ritmo-turno`, e ela é deliberada: é o eixo em que a
   * proposta da análise espera confirmação humana. Preenchê-lo faria a
   * cobertura subir e apagaria a demonstração da supervisão.
   */
  const eixosDeclaradosPelaCerrado = new Set(
    DEMO_CULTURE_ANSWERS.filter(
      (resposta) =>
        resposta.companyId === 'EMP-01' && resposta.respondent === 'gestao'
    ).map((resposta) => resposta.axisId)
  );

  it('a empresa padrão responde todos os eixos menos o da proposta assistida', () => {
    expect(eixosDeclaradosPelaCerrado.size).toBe(CULTURE_QUESTIONS.length - 1);
  });

  it('a lacuna é o eixo do cenário de confirmação humana', () => {
    const semResposta = CULTURE_QUESTIONS.map((q) => q.axisId).filter(
      (axisId) => !eixosDeclaradosPelaCerrado.has(axisId)
    );

    expect(semResposta).toEqual(['ritmo-turno']);
  });
});

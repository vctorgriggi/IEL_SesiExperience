import type { DemoAction } from './reducer';
import type { PersistedState } from './storage';

/**
 * Sincronia com a sala no servidor (modo compartilhado).
 *
 * O provider aplica cada ação localmente na hora (otimista) e entrega aqui
 * uma cópia. Este módulo faz o resto: manda as ações ao servidor **uma por
 * vez, na ordem**, e sonda o estado da sala enquanto a aba está visível —
 * é assim que o notebook da analista vê a resposta que o candidato deu no
 * celular.
 *
 * Duas regras que evitam o estado "voltar no tempo" na tela:
 *
 * 1. A resposta de um POST só rehidrata quando a fila esvaziou. Se ainda há
 *    ações locais esperando envio, o delta do servidor ainda não as contém,
 *    e aplicá-lo apagaria por um instante o que a pessoa acabou de fazer.
 *    A última resposta da rajada traz tudo.
 * 2. O polling só rehidrata quando a `revisao` mudou e a fila está vazia,
 *    pelo mesmo motivo.
 *
 * Os caminhos ficam aqui, e não em `@workspace/routes`, porque as duas
 * rotas são exclusivas da demo e o pacote de rotas está sendo reorganizado
 * em paralelo; mover para lá quando assentar.
 */

/** Sala usada quando ninguém pede outra: a demonstração tem um palco só. */
export const SALA_PADRAO = 'principal';

const ROTA_ESTADO = '/api/iel/estado';
const ROTA_ACOES = '/api/iel/acoes';

/** Sondagem: 4 s é rápido o bastante para uma demo ao vivo sem martelar. */
export const INTERVALO_DE_SONDAGEM_MS = 4000;

export type SalaRecebida = {
  revisao: number;
  persisted: PersistedState;
};

export type OpcoesDeSincronia = {
  sala: string;
  /** Revisão que o servidor entregou junto com o estado inicial. */
  revisaoInicial: number;
  /** Chamado com o delta autoritativo quando é seguro rehidratar. */
  aoReceber: (sala: SalaRecebida) => void;
  /** Uma falha de rede: o estado local fica; a pessoa é avisada uma vez. */
  aoFalhar: (mensagem: string) => void;
};

export type Sincronia = {
  /** Enfileira a ação para envio. Nunca rejeita. */
  enviar: (action: DemoAction) => void;
  /** Reinicia a sala no servidor (DELETE) e rehidrata com a base. */
  reiniciar: () => Promise<void>;
  /** Liga a sondagem (visibilidade + intervalo). Devolve o desligar. */
  iniciar: () => () => void;
};

type ResultadoDaFila =
  | { ok: true; sala: SalaRecebida }
  | { ok: false; erro: string };

async function post(
  caminho: string,
  metodo: 'POST' | 'DELETE',
  corpo: unknown
): Promise<ResultadoDaFila> {
  try {
    const resposta = await fetch(caminho, {
      method: metodo,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    if (!resposta.ok) {
      const texto = (await resposta.json().catch(() => null)) as {
        erro?: string;
      } | null;
      return { ok: false, erro: texto?.erro ?? `HTTP ${resposta.status}` };
    }
    return { ok: true, sala: (await resposta.json()) as SalaRecebida };
  } catch (erro) {
    return {
      ok: false,
      erro: erro instanceof Error ? erro.message : 'falha de rede'
    };
  }
}

export function criarSincronia(opcoes: OpcoesDeSincronia): Sincronia {
  let revisao = opcoes.revisaoInicial;
  const fila: DemoAction[] = [];
  let enviando = false;
  /** Evita uma enxurrada de toasts quando a rede cai no meio de uma rajada. */
  let avisouFalha = false;

  function receber(sala: SalaRecebida): void {
    revisao = Math.max(revisao, sala.revisao);
    opcoes.aoReceber(sala);
  }

  async function esvaziar(): Promise<void> {
    if (enviando) return;
    enviando = true;
    try {
      while (fila.length > 0) {
        const acao = fila[0]!;
        const resultado = await post(ROTA_ACOES, 'POST', {
          sala: opcoes.sala,
          acao
        });
        // Sai da fila mesmo em falha: reenviar uma ação que talvez tenha
        // sido aplicada duplicaria o efeito (dois check-ins, duas notas).
        // O estado local já mostra o que a pessoa fez; a próxima sondagem
        // realinha quando a rede voltar.
        fila.shift();
        if (!resultado.ok) {
          if (!avisouFalha) {
            avisouFalha = true;
            opcoes.aoFalhar(
              'Não deu para gravar no servidor. O que você fez fica nesta tela; tente de novo em instantes.'
            );
          }
          continue;
        }
        avisouFalha = false;
        // Regra 1: só rehidrata com a última resposta da rajada.
        if (fila.length === 0) receber(resultado.sala);
        else revisao = Math.max(revisao, resultado.sala.revisao);
      }
    } finally {
      enviando = false;
    }
  }

  async function sondar(): Promise<void> {
    // Regra 2: com ações a caminho, a resposta do POST vai trazer o estado.
    if (enviando || fila.length > 0) return;
    try {
      const resposta = await fetch(
        `${ROTA_ESTADO}?sala=${encodeURIComponent(opcoes.sala)}`,
        { cache: 'no-store' }
      );
      if (!resposta.ok) return;
      const sala = (await resposta.json()) as SalaRecebida;
      if (sala.revisao === revisao) return;
      // A fila pode ter ganhado ação enquanto a resposta viajava.
      if (enviando || fila.length > 0) return;
      receber(sala);
    } catch {
      // Sondagem é melhor esforço: a próxima tenta de novo.
    }
  }

  return {
    enviar(action) {
      fila.push(action);
      void esvaziar();
    },

    async reiniciar() {
      // Descarta o que ainda não foi: reiniciar apaga tudo mesmo.
      fila.length = 0;
      const resultado = await post(ROTA_ACOES, 'DELETE', {
        sala: opcoes.sala
      });
      if (!resultado.ok) {
        opcoes.aoFalhar('Não deu para reiniciar no servidor. Tente de novo.');
        return;
      }
      receber(resultado.sala);
    },

    iniciar() {
      let temporizador: ReturnType<typeof setInterval> | null = null;

      const ligar = () => {
        if (temporizador) return;
        void sondar();
        temporizador = setInterval(
          () => void sondar(),
          INTERVALO_DE_SONDAGEM_MS
        );
      };
      const desligar = () => {
        if (!temporizador) return;
        clearInterval(temporizador);
        temporizador = null;
      };
      // Aba escondida não sonda: poupa o servidor e a bateria do celular.
      // Ao voltar, sonda na hora — é o momento em que a pessoa olha a tela.
      const aoMudarVisibilidade = () => {
        if (document.visibilityState === 'visible') ligar();
        else desligar();
      };

      document.addEventListener('visibilitychange', aoMudarVisibilidade);
      if (document.visibilityState === 'visible') ligar();

      return () => {
        document.removeEventListener('visibilitychange', aoMudarVisibilidade);
        desligar();
      };
    }
  };
}

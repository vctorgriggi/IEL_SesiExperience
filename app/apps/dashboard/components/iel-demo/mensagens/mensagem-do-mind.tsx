'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  diasEsperando as diasEsperandoDevolutiva,
  lerDevolutiva
} from '@/features/iel-demo/analysis/devolutiva';
import {
  destinatarioDaEtapa,
  ETAPA_LABEL,
  ETAPAS_DA_MENSAGEM,
  gerarMensagem,
  primeiroNome,
  type EntradaDaMensagem,
  type EtapaDaMensagem,
  type MensagemAoCandidato
} from '@/features/iel-demo/analysis/mensagens';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  CANDIDATE_FIT_DEADLINE_DAYS,
  getApplication,
  getCandidateJobView,
  getCompany,
  getJob,
  getRegisteredReferrals,
  getReportTokenForJob,
  getSituacaoDeContratacao,
  getTalent,
  perguntasQueFaltam
} from '@/features/iel-demo/state/selectors';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { DemoState } from '@/features/iel-demo/types';
import { Copy, Send, SparklesIcon } from 'lucide-react';

import { baseUrl, routes } from '@workspace/routes';
import { toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import { Label } from '@workspace/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';

import { SimularEnvioDialog } from '../chat/simular-envio-dialog';
import { BADGE_DE_ESTADO } from '../metricas/cores';
import { formatarDataCurta } from '../shared/datas';

/**
 * A mensagem de WhatsApp para esta pessoa, nesta etapa — rascunhada pelo
 * Mind, aprovada pela analista.
 *
 * Os jurados pediram foco na comunicação com o candidato. Aqui ela deixa de
 * ser um link seco: a regra fixa (`analysis/mensagens.ts`) monta a mensagem
 * na hora, no navegador, e a tela a mostra num balão de WhatsApp; em
 * seguida pede a `/api/iel/mensagens` uma versão reescrita pelo Mind com o
 * contexto da vaga. Se ela vier (`origem: 'mind'`), o texto troca com uma
 * transição discreta e ganha o selo "rascunho do Mind". Se não vier, fica
 * a regra — sem aviso, porque não houve erro.
 *
 * O texto é editável: a analista muda uma palavra, copia e manda pelo
 * WhatsApp do IEL. Nada é enviado por aqui, e o Mind não manda nada sozinho
 * — é a supervisão humana do edital, e o princípio 1 do PRODUTO.md: a
 * mensagem custa zero; a IA é polimento.
 *
 * O que sai para a rota: só o que a mensagem precisa — primeiro nome,
 * atividade, localidade, turno, prazo, marco e o link. Nunca o nome da
 * empresa (R5): a vaga chega por `getCandidateJobView`, que não o tem.
 */

export type MensagemDoMindProps = {
  applicationId: string;
  /** A etapa que a tela deduziu; a analista pode trocar no seletor. */
  etapa: EtapaDaMensagem;
  /** Primeiro nome de quem assina. Sem ele, assina o IEL. */
  analista?: string;
  /** Chamado quando a analista copia ou simula o envio. */
  onEnviada?: (mensagem: MensagemAoCandidato) => void;
};

/** Quanto a tela espera pelo Mind antes de desistir, em silêncio. */
const ESPERA_PELO_MIND_MS = 14_000;

/** Duração da troca de texto: some, troca, volta. */
const TRANSICAO_MS = 180;

/** A hora do balão: a da máquina, como no WhatsApp. */
function horaAgora(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * O link como ele vai no WhatsApp: absoluto. `NEXT_PUBLIC_DASHBOARD_URL`
 * quando configurada; senão, a origem da página — o mesmo que
 * `simular-envio-dialog.tsx` faz.
 */
function linkAbsoluto(caminho: string): string {
  if (/^https?:\/\//.test(caminho)) return caminho;
  if (baseUrl.dashboard) return new URL(caminho, baseUrl.dashboard).toString();
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${caminho}`;
  }
  return caminho;
}

/** O último dia para responder: candidatura + 2 dias (R7), em "dd/mm". */
function prazoDoQuestionario(appliedAt: string): string | undefined {
  const base = Date.parse(`${appliedAt.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(base)) return undefined;
  const limite = new Date(base + CANDIDATE_FIT_DEADLINE_DAYS * 86_400_000);
  return formatarDataCurta(limite.toISOString().slice(0, 10));
}

/**
 * Qual link cada etapa leva: questionário, "minha candidatura", check-in —
 * ou, na cobrança ao RH, o relatório da vaga que a empresa abre sem login.
 */
function linkDaEtapa(
  etapa: EtapaDaMensagem,
  applicationId: string,
  jobId: string | undefined
): string {
  const candidatura = routes.dashboard.iel.applications.byId(applicationId);
  if (etapa === 'convite-questionario' || etapa === 'lembrete-questionario') {
    return linkAbsoluto(candidatura.fit);
  }
  if (etapa === 'como-esta-sendo') return linkAbsoluto(candidatura.checkIn);
  if (etapa === 'cobrar-devolutiva' && jobId) {
    return linkAbsoluto(
      routes.dashboard.iel.report.byToken(getReportTokenForJob(jobId))
    );
  }
  return linkAbsoluto(candidatura.index);
}

/** O que a cobrança ao RH precisa saber desta pessoa enviada. */
type Cobranca = {
  empresa: string;
  /** Primeiro nome do contato do RH: é a quem a mensagem fala. */
  contato: string;
  pessoaEnviada: string;
  diasEsperando: number | undefined;
};

/**
 * A remessa registrada em que esta candidatura foi enviada, para a etapa
 * `cobrar-devolutiva`. `null` quando a pessoa ainda não foi enviada — a
 * regra fixa então fala de "a empresa" e "a pessoa", sem inventar.
 */
function cobrancaDaCandidatura(
  state: DemoState,
  applicationId: string,
  pessoaEnviada: string
): Cobranca | null {
  for (const referral of getRegisteredReferrals(state)) {
    const item = referral.items.find(
      (entry) => entry.applicationId === applicationId
    );
    if (!item) continue;
    const company = getCompany(referral.companyId);
    return {
      empresa: company?.name ?? '',
      contato: primeiroNome(company?.contactName ?? ''),
      pessoaEnviada,
      diasEsperando:
        diasEsperandoDevolutiva(
          lerDevolutiva(item.outcome),
          referral.createdAt,
          nowIso()
        ) ?? undefined
    };
  }
  return null;
}

export function MensagemDoMind({
  applicationId,
  etapa: etapaSugerida,
  analista,
  onEnviada
}: MensagemDoMindProps) {
  const { state } = useIelDemo();
  const [etapa, setEtapa] = useState<EtapaDaMensagem>(etapaSugerida);
  // A etapa deduzida pela tela vence quando a pessoa muda.
  useEffect(() => {
    setEtapa(etapaSugerida);
  }, [etapaSugerida, applicationId]);

  const application = getApplication(state, applicationId);
  const talento = application ? getTalent(application.talentId, state) : null;
  const vaga = getCandidateJobView(state, applicationId);
  const contratacao = getSituacaoDeContratacao(state, applicationId);

  /*
   * Os seletores devolvem objeto novo a cada render; a entrada é memorizada
   * sobre os valores, não sobre os objetos — senão o pedido ao Mind sairia
   * a cada render, e não a cada mudança de pessoa ou de etapa.
   */
  const destinatario = destinatarioDaEtapa(etapa);
  const nomeDaPessoa = talento?.name ?? '';
  // A cobrança fala com o RH, não com a pessoa: quem, empresa e há quanto
  // tempo vêm da remessa registrada. Só é lida nessa etapa.
  const cobranca =
    destinatario === 'empresa'
      ? cobrancaDaCandidatura(state, applicationId, nomeDaPessoa)
      : null;
  const nome = cobranca ? cobranca.contato : primeiroNome(nomeDaPessoa);
  const atividade = vaga?.activity;
  const localidade = vaga?.location;
  const turno = vaga?.shift;
  const prazo = application
    ? prazoDoQuestionario(application.appliedAt)
    : undefined;
  const marco = contratacao?.marcoAtual ?? contratacao?.pendentes[0];
  const link = linkDaEtapa(etapa, applicationId, application?.jobId);
  const empresa = cobranca?.empresa;
  const pessoaEnviada = cobranca?.pessoaEnviada;
  const diasEsperando = cobranca?.diasEsperando;
  const vagaParaOSimulador = application
    ? getJob(application.jobId)?.title
    : undefined;
  /*
   * Quantas frases esta pessoa ainda tem para responder nesta candidatura.
   * Deixou de ser 10 no dia em que a empresa passou a escolher de 3 a 11
   * competências, e já variava com o reaproveitamento: a conta vem do
   * estado e o texto só a recebe pronta.
   */
  const frasesQueFaltam = application
    ? perguntasQueFaltam(state, applicationId).length
    : null;

  // A entrada da regra fixa, montada só com o que o candidato pode ver —
  // salvo na cobrança ao RH, em que empresa e pessoa entram de propósito.
  const entrada = useMemo<EntradaDaMensagem | null>(() => {
    if (!atividade) return null;
    return {
      etapa,
      primeiroNome: nome,
      atividade,
      ...(localidade ? { localidade } : {}),
      ...(turno ? { turno } : {}),
      ...(prazo ? { prazo } : {}),
      ...(frasesQueFaltam !== null ? { frasesQueFaltam } : {}),
      ...(marco ? { marco } : {}),
      link,
      ...(analista ? { analista } : {}),
      ...(empresa ? { empresa } : {}),
      ...(pessoaEnviada ? { pessoaEnviada } : {}),
      ...(diasEsperando !== undefined ? { diasEsperando } : {})
    };
  }, [
    etapa,
    nome,
    atividade,
    localidade,
    turno,
    prazo,
    frasesQueFaltam,
    marco,
    link,
    analista,
    empresa,
    pessoaEnviada,
    diasEsperando
  ]);

  const regra = useMemo(
    () => (entrada ? gerarMensagem(entrada) : null),
    [entrada]
  );

  const [mensagem, setMensagem] = useState<MensagemAoCandidato | null>(regra);
  const [texto, setTexto] = useState(regra?.texto ?? '');
  const [visivel, setVisivel] = useState(true);
  const [pedindo, setPedindo] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [hora] = useState(horaAgora);
  const campoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMensagem(regra);
    setTexto(regra?.texto ?? '');
    setVisivel(true);
    if (!entrada || !regra) return;

    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), ESPERA_PELO_MIND_MS);
    let troca: ReturnType<typeof setTimeout> | null = null;
    setPedindo(true);

    const { etapa: etapaDoPedido, ...resto } = entrada;
    fetch('/api/iel/mensagens', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ etapa: etapaDoPedido, entrada: resto }),
      signal: controle.signal
    })
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((corpo: MensagemAoCandidato | null) => {
        if (!corpo || corpo.origem !== 'mind') return;
        // Some, troca, volta: a analista percebe que o texto mudou sem que
        // ele pule na tela. Se ela já editou, a edição dela vence.
        setVisivel(false);
        troca = setTimeout(() => {
          setTexto((atual) => (atual === regra.texto ? corpo.texto : atual));
          setMensagem(corpo);
          setVisivel(true);
        }, TRANSICAO_MS);
      })
      .catch(() => {
        // Rede, timeout, 429: fica a regra fixa, e ninguém precisa saber.
      })
      .finally(() => {
        clearTimeout(relogio);
        setPedindo(false);
      });

    return () => {
      controle.abort();
      clearTimeout(relogio);
      if (troca) clearTimeout(troca);
    };
  }, [entrada, regra]);

  if (!entrada || !regra || !mensagem) {
    return (
      <p className="text-sm text-muted-foreground">
        Candidatura não encontrada.
      </p>
    );
  }

  const mensagemFinal: MensagemAoCandidato = { ...mensagem, texto };
  const editada = texto !== mensagem.texto;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success('Mensagem copiada. Agora é colar no WhatsApp do IEL.');
      onEnviada?.(mensagemFinal);
    } catch {
      // Sem permissão de área de transferência (ou sem HTTPS): o texto já
      // está no campo — fica selecionado para copiar à mão.
      campoRef.current?.focus();
      campoRef.current?.select();
      toast.info('Não deu para copiar. O texto está selecionado no campo.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="etapa-da-mensagem">Etapa</Label>
        <Select
          value={etapa}
          onValueChange={(valor) => {
            const escolhida = ETAPAS_DA_MENSAGEM.find((item) => item === valor);
            if (escolhida) setEtapa(escolhida);
          }}
        >
          <SelectTrigger
            id="etapa-da-mensagem"
            size="sm"
            className="w-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ETAPAS_DA_MENSAGEM.map((item) => (
              <SelectItem
                key={item}
                value={item}
              >
                {ETAPA_LABEL[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/*
       * A prévia fiel: o balão verde de quem manda, hora e os dois tiques.
       * O verde é o "combina" de `cores.ts` — o mesmo tom que a base já usa
       * — e a moldura é a do "Simular envio", em Tailwind, sem token novo.
       */}
      <div
        aria-live="polite"
        data-origem={mensagem.origem}
        className="flex flex-col gap-2 rounded-lg border bg-secondary/60 p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            Como chega no celular de {entrada.primeiroNome || 'quem recebe'}
          </span>
          {mensagem.origem === 'mind' ? (
            <Badge
              variant="outline"
              className="gap-1 px-1.5 text-muted-foreground"
            >
              <SparklesIcon aria-hidden="true" />
              rascunho do Mind
            </Badge>
          ) : pedindo ? (
            <span className="text-[11px] text-muted-foreground">
              o Mind está revisando…
            </span>
          ) : (
            <Badge
              variant="outline"
              className="px-1.5 text-muted-foreground"
            >
              regra fixa
            </Badge>
          )}
        </div>
        <div
          className={cn(
            'ml-auto flex max-w-[92%] flex-col gap-1 rounded-lg rounded-tr-none p-2.5 text-xs leading-relaxed shadow-xs motion-safe:transition-opacity motion-safe:duration-200',
            BADGE_DE_ESTADO.combina,
            visivel ? 'opacity-100' : 'opacity-0'
          )}
        >
          <p className="break-words whitespace-pre-wrap">{texto}</p>
          <span className="self-end text-[10px] opacity-70">
            {hora} <span aria-hidden="true">✓✓</span>
            <span className="sr-only">enviada e lida</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="texto-da-mensagem">
          Texto{' '}
          <span className="font-normal text-muted-foreground">
            {editada ? '· editado por você' : '· pode mudar o que quiser'}
          </span>
        </Label>
        <textarea
          ref={campoRef}
          id="texto-da-mensagem"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          rows={9}
          className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={copiar}
          disabled={texto.trim().length === 0}
        >
          <Copy aria-hidden="true" />
          Copiar
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSimulando(true)}
        >
          <Send aria-hidden="true" />
          Simular envio
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Nada é enviado por aqui: você lê, ajusta se quiser e manda pelo WhatsApp
        do IEL. O Mind rascunha; quem aprova é você.
      </p>

      <SimularEnvioDialog
        destinatario={destinatario}
        link={mensagem.link ?? link}
        contexto={
          destinatario === 'empresa'
            ? { empresa, vaga: vagaParaOSimulador }
            : {
                atividade,
                cidade: localidade,
                ...(frasesQueFaltam !== null ? { frasesQueFaltam } : {})
              }
        }
        textoPronto={texto}
        open={simulando}
        onOpenChange={(aberto) => {
          setSimulando(aberto);
          if (aberto) onEnviada?.(mensagemFinal);
        }}
      />
    </div>
  );
}

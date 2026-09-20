'use client';

import { useMemo, useState } from 'react';
import { CANAL_LABEL } from '@/features/iel-demo/analysis/analytics';
import { CULTURE_INVITE_DEADLINE_DAYS } from '@/features/iel-demo/analysis/culture-invites';
import type { EtapaDaMensagem } from '@/features/iel-demo/analysis/mensagens';
import {
  ESTADO_DO_PRAZO_LABEL,
  ESTADOS_DO_PRAZO,
  fraseDaEspera,
  fraseDoPrazo,
  fraseDoProximoAutomatico,
  fraseDosLembretes,
  getSolicitacoes,
  JANELA_DE_RESPONDIDOS_DIAS,
  LEMBRETE_ANTES_DO_PRAZO_HORAS,
  LEMBRETE_APOS_ENVIO_HORAS,
  TIPO_DE_SOLICITACAO_LABEL,
  TIPOS_DE_SOLICITACAO,
  type EstadoDoPrazo,
  type Solicitacao
} from '@/features/iel-demo/analysis/solicitacoes';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import { nowIso } from '@/features/iel-demo/state/storage';
import {
  IconBellRinging,
  IconCircleCheck,
  IconClockExclamation,
  IconHourglassHigh,
  IconMessage,
  IconSend
} from '@tabler/icons-react';

import { toast } from '@workspace/ui';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@workspace/ui/shadcn/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@workspace/ui/shadcn/table';
import { Tabs, TabsList, TabsTrigger } from '@workspace/ui/shadcn/tabs';

import { MensagemDoMindSheet } from '../mensagens/mensagem-do-mind-sheet';
import { BADGE_DE_ESTADO, type EstadoDeCor } from '../metricas/cores';
import { CartaoDeIndicador } from '../metricas/kpi-card';
import { ABAS_SEM_ROLAGEM } from '../shared/abas';
import { formatarDataHora } from '../shared/datas';

const TODOS = 'todos';

/** Quantas linhas entram por vez: a base tem milhares de candidaturas. */
const PAGINA = 30;

/** Vencido difere, vencendo é atenção, no prazo é neutro (`cores.ts`). */
const TOM_DO_PRAZO: Record<EstadoDoPrazo, EstadoDeCor> = {
  vencido: 'difere',
  'vence-hoje': 'atencao',
  'no-prazo': 'neutro'
};

/** A gaveta do Mind: para quem e em qual etapa. */
type Gaveta = { applicationId: string; etapa: EtapaDaMensagem };

/**
 * A aba Simples de Questionários: o que o IEL está esperando de quem.
 *
 * Uma linha por espera — questionário do candidato, consulta ao colaborador,
 * devolutiva da empresa, "como está sendo" — com desde quando, o prazo que o
 * cliente deu (R7, R9), por onde foi, quantos lembretes já saíram e quando
 * sai o próximo automático. É a lista de "ficar em cima" (00:44:09), que
 * antes morava em quatro telas.
 *
 * As ações são as que já existem no produto: reenviar o link (candidato e
 * colaborador), abrir a mensagem do Mind (candidato e contratado) e cobrar
 * a empresa pela mensagem do Mind ao RH. Nada é enviado por aqui sozinho.
 */
export function SolicitacoesSimples() {
  const { state, dispatch } = useIelDemo();
  /*
   * O "agora" é fixado na abertura da aba: a hora decide qual lembrete
   * automático é o próximo, e um relógio vivo refaria a lista inteira a
   * cada render sem mudar nada que a analista veja.
   */
  const [agora] = useState(nowIso);
  const [tipo, setTipo] = useState<string>(TODOS);
  const [estado, setEstado] = useState<string>(TODOS);
  const [limite, setLimite] = useState(PAGINA);
  const [gaveta, setGaveta] = useState<Gaveta | null>(null);
  const [gavetaAberta, setGavetaAberta] = useState(false);

  const leitura = useMemo(() => getSolicitacoes(state, agora), [state, agora]);

  const filtradas = useMemo(
    () =>
      leitura.linhas.filter(
        (linha) =>
          (tipo === TODOS || linha.tipo === tipo) &&
          (estado === TODOS || linha.estado === estado)
      ),
    [leitura, tipo, estado]
  );
  const visiveis = filtradas.slice(0, limite);

  const abrirMind = (applicationId: string, etapa: EtapaDaMensagem) => {
    setGaveta({ applicationId, etapa });
    setGavetaAberta(true);
  };

  const reenviar = (linha: Solicitacao) => {
    if (linha.tipo === 'questionario-do-candidato') {
      if (!linha.applicationId || !linha.canal) return;
      dispatch({
        type: 'resend-fit-invite',
        applicationId: linha.applicationId,
        canal: linha.canal,
        at: nowIso()
      });
      toast.success(
        `Lembrete reenviado por ${CANAL_LABEL[linha.canal]}. O link é o mesmo.`
      );
      return;
    }
    if (linha.tipo === 'consulta-ao-colaborador' && linha.inviteId) {
      dispatch({
        type: 'resend-culture-invite',
        inviteId: linha.inviteId,
        at: nowIso()
      });
      toast.success(
        `Link reenviado, com mais ${CULTURE_INVITE_DEADLINE_DAYS} dias de prazo.`
      );
    }
  };

  const { contadores } = leitura;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CartaoDeIndicador
          rotulo="Esperando resposta"
          valor={contadores.esperando}
          icone={IconHourglassHigh}
          tom="pessoa"
          rodape="candidatos, colaboradores, empresas e contratados"
          apoio="Tudo o que o IEL mandou e ainda não voltou: questionário do candidato, consulta ao colaborador, devolutiva da empresa e o 'como está sendo' de quem foi contratado."
        />
        <CartaoDeIndicador
          rotulo="Vence hoje"
          valor={contadores.vencendoHoje}
          icone={IconClockExclamation}
          tom={contadores.vencendoHoje > 0 ? 'atencao' : 'neutro'}
          rodape="último dia para responder"
          apoio="Prazos: 2 dias para o candidato, 3 para o colaborador, 15 para a devolutiva da empresa e 30 para o 'como está sendo'."
        />
        <CartaoDeIndicador
          rotulo="Vencidos"
          valor={contadores.vencidos}
          icone={IconBellRinging}
          tom={contadores.vencidos > 0 ? 'difere' : 'neutro'}
          rodape="passaram do prazo sem resposta"
          apoio="Quem passou do prazo continua na lista até responder ou até a analista decidir o que fazer. Sair da lista sozinho seria sumir em silêncio."
        />
        <CartaoDeIndicador
          rotulo={`Respondidos em ${JANELA_DE_RESPONDIDOS_DIAS} dias`}
          valor={contadores.respondidosNaJanela}
          icone={IconCircleCheck}
          tom="combina"
          rodape="respostas que chegaram na semana"
          apoio={`Questionários, consultas, devolutivas e check-ins respondidos nos últimos ${JANELA_DE_RESPONDIDOS_DIAS} dias.`}
        />
      </div>

      <section
        aria-labelledby="esperando-de-quem"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2
            id="esperando-de-quem"
            className="text-base font-medium"
          >
            Esperando de quem
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              value={estado}
              onValueChange={(valor) => {
                setEstado(valor);
                setLimite(PAGINA);
              }}
            >
              <TabsList className={ABAS_SEM_ROLAGEM}>
                <TabsTrigger value={TODOS}>
                  Todas
                  <Contador n={leitura.linhas.length} />
                </TabsTrigger>
                {ESTADOS_DO_PRAZO.map((valor) => (
                  <TabsTrigger
                    key={valor}
                    value={valor}
                  >
                    {valor === 'vencido'
                      ? 'Vencidas'
                      : ESTADO_DO_PRAZO_LABEL[valor]}
                    <Contador n={leitura.porEstado[valor]} />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Select
              value={tipo}
              onValueChange={(valor) => {
                setTipo(valor);
                setLimite(PAGINA);
              }}
            >
              <SelectTrigger
                size="sm"
                className="w-[220px]"
                aria-label="Tipo de espera"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value={TODOS}>Todos os tipos</SelectItem>
                {TIPOS_DE_SOLICITACAO.map((valor) => (
                  <SelectItem
                    key={valor}
                    value={valor}
                  >
                    {TIPO_DE_SOLICITACAO_LABEL[valor]} ({leitura.porTipo[valor]}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              {leitura.linhas.length === 0
                ? 'Ninguém está devendo resposta ao IEL agora.'
                : 'Nada neste recorte. Tire um filtro para ver o resto.'}
            </p>
          </div>
        ) : (
          <>
            {/*
             * No celular a tabela de oito colunas não cabe sem rolagem
             * horizontal: a mesma lista vira cartões empilhados. Só um dos
             * dois chega ao leitor de tela, pelo `hidden`.
             */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {visiveis.map((linha) => (
                <li
                  key={linha.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-medium">{linha.quem}</span>
                      {linha.quemDetalhe ? (
                        <span className="text-xs text-muted-foreground">
                          {linha.quemDetalhe}
                        </span>
                      ) : null}
                    </div>
                    <BadgeDoPrazo linha={linha} />
                  </div>
                  <div className="flex flex-col">
                    <span>{TIPO_DE_SOLICITACAO_LABEL[linha.tipo]}</span>
                    <span className="text-xs text-muted-foreground">
                      {linha.contexto}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Esperando</dt>
                    <dd>{fraseDaEspera(linha.esperandoDias)}</dd>
                    <dt className="text-muted-foreground">Canal</dt>
                    <dd>{linha.canal ? CANAL_LABEL[linha.canal] : '—'}</dd>
                    <dt className="text-muted-foreground">Lembretes</dt>
                    <dd>{fraseDosLembretes(linha.lembretes, agora)}</dd>
                    <dt className="text-muted-foreground">
                      Próximo automático
                    </dt>
                    <dd>
                      <ProximoAutomatico
                        linha={linha}
                        agora={agora}
                      />
                    </dd>
                  </dl>
                  <div className="flex flex-wrap gap-2">
                    <Acoes
                      linha={linha}
                      onReenviar={reenviar}
                      onMind={abrirMind}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden rounded-lg border lg:block">
              <Table>
                <TableCaption className="sr-only">
                  O que o IEL está esperando, do mais vencido ao que ainda tem
                  prazo
                </TableCaption>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead scope="col">Quem</TableHead>
                    <TableHead scope="col">O quê</TableHead>
                    <TableHead scope="col">Esperando</TableHead>
                    <TableHead scope="col">Prazo</TableHead>
                    <TableHead scope="col">Canal</TableHead>
                    <TableHead scope="col">Lembretes</TableHead>
                    <TableHead scope="col">Próximo automático</TableHead>
                    <TableHead
                      scope="col"
                      className="text-right"
                    >
                      Ação
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((linha) => (
                    <TableRow key={linha.id}>
                      <TableCell className="max-w-[24ch] align-top whitespace-normal">
                        <span className="font-medium">{linha.quem}</span>
                        {linha.quemDetalhe ? (
                          <p className="text-xs text-muted-foreground">
                            {linha.quemDetalhe}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[30ch] align-top whitespace-normal">
                        {TIPO_DE_SOLICITACAO_LABEL[linha.tipo]}
                        <p className="text-xs text-muted-foreground">
                          {linha.contexto}
                        </p>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        {fraseDaEspera(linha.esperandoDias)}
                      </TableCell>
                      <TableCell className="align-top">
                        <BadgeDoPrazo linha={linha} />
                      </TableCell>
                      <TableCell className="align-top">
                        {linha.canal ? CANAL_LABEL[linha.canal] : '—'}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        {fraseDosLembretes(linha.lembretes, agora)}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        <ProximoAutomatico
                          linha={linha}
                          agora={agora}
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Acoes
                            linha={linha}
                            onReenviar={reenviar}
                            onMind={abrirMind}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                {visiveis.length} de{' '}
                {plural(filtradas.length, 'linha', 'linhas')}
              </span>
              {filtradas.length > limite ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLimite((atual) => atual + PAGINA)}
                >
                  Mostrar mais {Math.min(PAGINA, filtradas.length - limite)}
                </Button>
              ) : null}
            </div>
          </>
        )}

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>
            Lembrete automático: {LEMBRETE_APOS_ENVIO_HORAS} h depois do envio e{' '}
            {LEMBRETE_ANTES_DO_PRAZO_HORAS} h antes do prazo, pelo mesmo canal e
            com o mesmo link.
          </p>
        </div>
      </section>

      <MensagemDoMindSheet
        applicationId={gaveta?.applicationId ?? null}
        etapa={gaveta?.etapa ?? 'lembrete-questionario'}
        open={gavetaAberta}
        onOpenChange={setGavetaAberta}
      />
    </div>
  );
}

/** O número ao lado do nome da aba, como no data table do shadcn. */
function Contador({ n }: { n: number }) {
  return (
    <Badge
      variant="secondary"
      className="ml-1 h-5 min-w-5 rounded-full px-1 font-mono text-[10px] tabular-nums"
    >
      {n}
    </Badge>
  );
}

/** "vence em 1 dia" / "vence hoje" / "venceu há 2 dias", na cor do estado. */
function BadgeDoPrazo({ linha }: { linha: Solicitacao }) {
  return (
    <Badge
      variant="outline"
      className={BADGE_DE_ESTADO[TOM_DO_PRAZO[linha.estado]]}
    >
      {fraseDoPrazo(linha.prazoEmDias)}
    </Badge>
  );
}

/** A frase do próximo lembrete simulado, com a data e a hora na dica. */
function ProximoAutomatico({
  linha,
  agora
}: {
  linha: Solicitacao;
  agora: string;
}) {
  const frase = fraseDoProximoAutomatico(
    linha.proximoAutomaticoEm,
    linha.estado,
    agora
  );
  return linha.proximoAutomaticoEm ? (
    <span title={formatarDataHora(linha.proximoAutomaticoEm)}>{frase}</span>
  ) : (
    <span className="text-muted-foreground">{frase}</span>
  );
}

/**
 * As ações de cada tipo, só com o que já existe no produto: reenviar o
 * link (candidato, colaborador), a mensagem do Mind (candidato: lembrete;
 * contratado: como está sendo) e cobrar a empresa (a mensagem do Mind ao RH).
 */
function Acoes({
  linha,
  onReenviar,
  onMind
}: {
  linha: Solicitacao;
  onReenviar: (linha: Solicitacao) => void;
  onMind: (applicationId: string, etapa: EtapaDaMensagem) => void;
}) {
  const quem = linha.quem;
  switch (linha.tipo) {
    case 'questionario-do-candidato':
      return (
        <>
          {linha.canal ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReenviar(linha)}
            >
              <IconSend aria-hidden="true" />
              Reenviar
              <span className="sr-only"> o link para {quem}</span>
            </Button>
          ) : null}
          {linha.applicationId ? (
            <BotaoDoMind
              quem={quem}
              onClick={() =>
                onMind(linha.applicationId!, 'lembrete-questionario')
              }
            />
          ) : null}
        </>
      );
    case 'consulta-ao-colaborador':
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReenviar(linha)}
        >
          <IconSend aria-hidden="true" />
          Reenviar
          <span className="sr-only"> o link para {quem}</span>
        </Button>
      );
    case 'devolutiva-da-empresa':
      return linha.applicationId ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onMind(linha.applicationId!, 'cobrar-devolutiva')}
        >
          <IconMessage aria-hidden="true" />
          Cobrar a empresa
          <span className="sr-only"> pela devolutiva de {linha.contexto}</span>
        </Button>
      ) : null;
    case 'como-esta-sendo':
      return linha.applicationId ? (
        <BotaoDoMind
          quem={quem}
          onClick={() => onMind(linha.applicationId!, 'como-esta-sendo')}
        />
      ) : null;
  }
}

function BotaoDoMind({ quem, onClick }: { quem: string; onClick: () => void }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
    >
      <IconMessage aria-hidden="true" />
      Mensagem do Mind
      <span className="sr-only"> para {quem}</span>
    </Button>
  );
}

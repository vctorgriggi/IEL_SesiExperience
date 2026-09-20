'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import {
  COMO_ESTA_SENDO_LABEL,
  rotuloDoMarco,
  type SituacaoDeContratacao
} from '@/features/iel-demo/analysis/acompanhamento';
import { plural } from '@/features/iel-demo/format';
import { nowIso } from '@/features/iel-demo/state/storage';
import type { Talent } from '@/features/iel-demo/types';
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  LockIcon,
  PhoneIcon,
  X
} from 'lucide-react';

import { routes } from '@workspace/routes';
import { Textarea, toast } from '@workspace/ui';
import { cn } from '@workspace/ui/lib/utils';
import { Avatar, AvatarFallback } from '@workspace/ui/shadcn/avatar';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle
} from '@workspace/ui/shadcn/drawer';
import { Label } from '@workspace/ui/shadcn/label';
import { useIsMobile } from '@workspace/ui/use-mobile';

import { BADGE_DE_ESTADO, type EstadoDeCor } from '../metricas/cores';
import { formatarData, formatarDataCurta } from '../shared/datas';
import {
  ESTADO_DA_LINHA_LABEL,
  estadoDaLinha,
  fraseDaLinha,
  linhaDoTempo,
  roteiroDaLigacao,
  TOM_DO_ESTADO,
  type EstadoDoMarco
} from './leitura';

/** "Ana Ribeiro" vira "AR": duas letras bastam para o avatar. */
function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? '';
  const ultima =
    partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : '';
  return `${primeira}${ultima}`.toUpperCase();
}

/* ------------------------------------------------------------------ *
 * Anotações da ligação
 * ------------------------------------------------------------------ */

type AnotacaoDaLigacao = { texto: string; salvoEm: string };

const chaveDaLigacao = (applicationId: string) =>
  `mind-rh:ligacao-acompanhamento:${applicationId}`;

/**
 * A anotação fica no navegador de quem ligou, por candidatura — a mesma
 * forma do roteiro da empresa. É protótipo: não passa pelo estado da
 * demonstração e não sai daqui. Armazenamento bloqueado não quebra a tela.
 */
function lerAnotacao(applicationId: string): AnotacaoDaLigacao | null {
  try {
    const bruto = window.localStorage.getItem(chaveDaLigacao(applicationId));
    if (!bruto) return null;
    const lido = JSON.parse(bruto) as Partial<AnotacaoDaLigacao>;
    if (typeof lido.texto !== 'string' || typeof lido.salvoEm !== 'string')
      return null;
    return { texto: lido.texto, salvoEm: lido.salvoEm };
  } catch {
    return null;
  }
}

function gravarAnotacao(
  applicationId: string,
  anotacao: AnotacaoDaLigacao
): boolean {
  try {
    window.localStorage.setItem(
      chaveDaLigacao(applicationId),
      JSON.stringify(anotacao)
    );
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * A linha do tempo dos 90 dias
 * ------------------------------------------------------------------ */

const MARCO_VISUAL: Record<
  EstadoDoMarco,
  { rotulo: string; tom: EstadoDeCor; Icone: typeof CircleCheckIcon }
> = {
  respondido: { rotulo: 'Respondeu', tom: 'combina', Icone: CircleCheckIcon },
  aberto: { rotulo: 'Ligar hoje', tom: 'atencao', Icone: PhoneIcon },
  perdido: { rotulo: 'Sem resposta', tom: 'neutro', Icone: CircleMinusIcon },
  futuro: {
    rotulo: 'Ainda não chegou',
    tom: 'neutro',
    Icone: CircleDashedIcon
  },
  encerrado: {
    rotulo: 'Não se pergunta mais',
    tom: 'neutro',
    Icone: CircleDashedIcon
  }
};

/**
 * Os três marcos, um embaixo do outro, cada um com o que a pessoa disse.
 * A palavra carrega o estado; a cor só acompanha.
 */
function LinhaDoTempo({ situacao }: { situacao: SituacaoDeContratacao }) {
  return (
    <ol className="flex flex-col gap-3">
      {linhaDoTempo(situacao).map((marco) => {
        const visual = MARCO_VISUAL[marco.estado];
        return (
          <li
            key={marco.marco}
            className="grid grid-cols-[4.5rem_1fr] gap-3 text-sm"
          >
            <span className="font-medium tabular-nums">
              {rotuloDoMarco(marco.marco)}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    marco.estado === 'futuro' || marco.estado === 'encerrado'
                      ? 'text-muted-foreground'
                      : BADGE_DE_ESTADO[visual.tom]
                  }
                >
                  <visual.Icone aria-hidden="true" />
                  {visual.rotulo}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {marco.estado === 'respondido' && marco.checkIn
                    ? formatarDataCurta(marco.checkIn.respondidoEm)
                    : marco.estado === 'aberto' && marco.dias !== null
                      ? marco.dias === 0
                        ? 'abriu hoje'
                        : `aberto há ${plural(marco.dias, 'dia', 'dias')}`
                      : marco.estado === 'futuro' && marco.dias !== null
                        ? `em ${plural(marco.dias, 'dia', 'dias')}`
                        : null}
                </span>
              </div>
              {marco.checkIn ? (
                <>
                  <span>
                    {marco.checkIn.continua ? 'Continua' : 'Saiu'} ·{' '}
                    {COMO_ESTA_SENDO_LABEL[marco.checkIn.comoEstaSendo]}
                  </span>
                  {marco.checkIn.comentario ? (
                    <span className="text-muted-foreground">
                      “{marco.checkIn.comentario}”
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ *
 * A gaveta
 * ------------------------------------------------------------------ */

/**
 * Devolve o foco ao botão que abriu a gaveta.
 *
 * A lista da tela existe duas vezes no DOM (cartões no celular, tabela no
 * desktop), então o botão não tem `id`: tem uma chave em
 * `data-retorno-de-foco`, e aqui se foca o exemplar visível.
 */
function focarBotaoDeOrigem(chave: string): boolean {
  const candidatos = document.querySelectorAll<HTMLElement>(
    `[data-retorno-de-foco="${CSS.escape(chave)}"]`
  );
  for (const candidato of candidatos) {
    if (candidato.offsetParent !== null) {
      candidato.focus();
      return true;
    }
  }
  return false;
}

/**
 * A pessoa contratada em gaveta, sobre a fila.
 *
 * Quem abre está decidindo para quem ligar agora; navegar para outra página
 * perderia a fila. Aqui ficam o relógio dos 90 dias, o que a empresa avisou
 * e o roteiro da ligação. Não há nenhum botão que mande algo para a
 * empresa, de propósito: o que a pessoa responde é dela (PRODUTO.md §5.1).
 *
 * Os nomes são os mesmos da lista: a frase de uma linha aparece de novo aqui
 * em cima, para a gaveta não dizer a mesma coisa com outras palavras.
 */
export function DetalheDaPessoa({
  situacao,
  talent,
  empresa,
  vaga,
  empresaInformouEm,
  open,
  onOpenChange,
  comecarPeloRoteiro = false,
  retornarFocoPara
}: {
  situacao: SituacaoDeContratacao;
  talent: Talent;
  empresa: string;
  vaga: string;
  /** Quando a empresa disse "continua" ou "saiu"; `null` se nunca disse. */
  empresaInformouEm: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Vindo do botão Ligar, a gaveta já abre com o roteiro à mostra. */
  comecarPeloRoteiro?: boolean;
  /** Chave `data-retorno-de-foco` do botão que abriu, que recebe o foco ao fechar. */
  retornarFocoPara?: string;
}) {
  const isMobile = useIsMobile();
  const iel = routes.dashboard.iel;
  const idDaAnotacao = useId();

  const estado = estadoDaLinha(situacao);
  const primeiroNome = talent.name.split(' ')[0] ?? talent.name;
  const roteiro = roteiroDaLigacao({ situacao, primeiroNome, empresa, vaga });

  const [registrando, setRegistrando] = useState(false);
  const [salva, setSalva] = useState<AnotacaoDaLigacao | null>(null);
  const [rascunho, setRascunho] = useState('');

  /*
   * localStorage só existe no navegador: lê depois de montar, por pessoa. A
   * cada abertura o roteiro começa recolhido — ou aberto, quando quem abriu
   * foi o botão Ligar. Não mexe enquanto fecha, para não piscar o roteiro
   * durante a animação.
   */
  useEffect(() => {
    if (!open) return;
    const anotacao = lerAnotacao(situacao.applicationId);
    setSalva(anotacao);
    setRascunho(anotacao?.texto ?? '');
    setRegistrando(comecarPeloRoteiro);
  }, [situacao.applicationId, open, comecarPeloRoteiro]);

  const abrirRoteiro = () => {
    setRascunho(salva?.texto ?? '');
    setRegistrando(true);
  };

  const guardar = () => {
    const anotacao = { texto: rascunho, salvoEm: nowIso() };
    if (gravarAnotacao(situacao.applicationId, anotacao)) {
      setSalva(anotacao);
      toast.success('Ligação registrada neste navegador, só para o IEL.');
    } else {
      toast.error('Não deu para guardar neste navegador.');
    }
    setRegistrando(false);
  };

  const empresaDisse = situacao.porFonte.empresa;

  return (
    <Drawer
      direction={isMobile ? 'bottom' : 'right'}
      open={open}
      onOpenChange={onOpenChange}
      // O vaul não move o foco para dentro por padrão; sem isso o leitor de
      // tela ficava parado na tabela, atrás da gaveta.
      autoFocus
    >
      <DrawerContent
        className="data-[vaul-drawer-direction=right]:sm:max-w-[560px]"
        onCloseAutoFocus={(evento) => {
          if (retornarFocoPara && focarBotaoDeOrigem(retornarFocoPara))
            evento.preventDefault();
        }}
      >
        <DrawerHeader className="flex-row items-center gap-3 border-b text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
          <Avatar
            className="size-10"
            aria-hidden="true"
          >
            <AvatarFallback className="text-[13px] font-semibold">
              {iniciais(talent.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DrawerTitle className="text-lg tracking-tight">
              {talent.name}
            </DrawerTitle>
            <DrawerDescription className="text-[13px]">
              {vaga} · {empresa} · começou em{' '}
              {formatarDataCurta(situacao.contratadoEm)}, há{' '}
              {plural(situacao.diasNaEmpresa, 'dia', 'dias')}
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto size-11 shrink-0 self-start text-muted-foreground"
            >
              <X aria-hidden="true" />
              <span className="sr-only">Fechar</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 text-sm">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={BADGE_DE_ESTADO[TOM_DO_ESTADO[estado]]}
              >
                {ESTADO_DA_LINHA_LABEL[estado]}
              </Badge>
              {/* A frase mais importante da gaveta, escrita, não só implícita. */}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <LockIcon
                  aria-hidden="true"
                  className="size-3"
                />
                O que a pessoa responde nunca vai para a empresa.
              </span>
            </div>
            {/* A mesma frase da lista: a gaveta detalha, não reformula. */}
            <p>{fraseDaLinha(situacao)}</p>
          </div>

          <section className="flex flex-col gap-3">
            <h3 className="text-base font-medium">Os 90 dias</h3>
            <LinhaDoTempo situacao={situacao} />
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-base font-medium">
              A empresa avisou alguma coisa?
            </h3>
            <p>
              {empresaDisse === null ? (
                <>
                  Não. Nada depois do “contratei” de{' '}
                  {formatarData(situacao.contratadoEm)}.
                  {situacao.porFonte.pessoa === 'saiu' ? (
                    <> A saída só está registrada porque a pessoa contou.</>
                  ) : null}
                </>
              ) : (
                <>
                  Sim: {empresaDisse === 'continua' ? 'continua' : 'saiu'}
                  {empresaInformouEm
                    ? `, avisado em ${formatarData(empresaInformouEm)}`
                    : ''}
                  .
                  {situacao.divergencia ? (
                    <>
                      {' '}
                      A pessoa contou o contrário; as duas versões ficam
                      registradas, cada uma com quem disse.
                    </>
                  ) : null}
                </>
              )}
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-medium">Ligação</h3>
              {registrando ? null : (
                <Button
                  size="sm"
                  onClick={abrirRoteiro}
                >
                  <PhoneIcon aria-hidden="true" />
                  Registrar ligação
                </Button>
              )}
            </div>
            {salva && !registrando ? (
              <p className="text-muted-foreground">
                Última ligação registrada em {formatarData(salva.salvoEm)}
                {salva.texto.trim() ? `: “${salva.texto.trim()}”` : '.'}
              </p>
            ) : null}
            {registrando ? (
              <div className="flex flex-col gap-4 rounded-lg border p-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Para ler ao telefone
                  </p>
                  <ol className="flex flex-col gap-2">
                    {roteiro.falas.map((fala, indice) => (
                      <li
                        key={fala}
                        className="grid grid-cols-[1.5rem_1fr] gap-2"
                      >
                        <span className="text-muted-foreground tabular-nums">
                          {indice + 1}.
                        </span>
                        <span>{fala}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="text-xs text-muted-foreground">
                    {roteiro.lembrete}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={idDaAnotacao}>O que ouvi</Label>
                  <Textarea
                    id={idDaAnotacao}
                    rows={3}
                    value={rascunho}
                    placeholder="Com as palavras da pessoa. Fica só no IEL."
                    onChange={(evento) => setRascunho(evento.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={guardar}
                  >
                    Guardar ligação
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRegistrando(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-4 py-3 text-[13px]'
          )}
        >
          <Link
            href={iel.applications.byId(situacao.applicationId).index}
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Abrir como a pessoa vê <span aria-hidden="true">→</span>
          </Link>
          {/* O link que a analista manda: a pergunta que a pessoa recebe. */}
          <Link
            href={iel.applications.byId(situacao.applicationId).checkIn}
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            A pergunta que a pessoa recebe <span aria-hidden="true">→</span>
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

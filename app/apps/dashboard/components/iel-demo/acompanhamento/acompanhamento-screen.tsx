'use client';

import { useMemo, useState } from 'react';
import { lerDevolutiva } from '@/features/iel-demo/analysis/devolutiva';
import { plural } from '@/features/iel-demo/format';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getAcompanhamento,
  getApplication,
  getCompany,
  getJob,
  getRegisteredReferrals,
  getTalent
} from '@/features/iel-demo/state/selectors';
import type { Talent } from '@/features/iel-demo/types';
import {
  IconBuildingSkyscraper,
  IconHeartHandshake,
  IconLock,
  IconPhone,
  IconUserCheck
} from '@tabler/icons-react';

import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
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

import { usePageHeader } from '../layout/page-header-context';
import { BADGE_DE_ESTADO } from '../metricas/cores';
import { CartaoDeIndicador } from '../metricas/kpi-card';
import { ABAS_SEM_ROLAGEM } from '../shared/abas';
import { DetalheDaPessoa } from './detalhe-da-pessoa';
import {
  ABA_LABEL,
  ABAS_DO_ACOMPANHAMENTO,
  ESTADO_DA_LINHA_LABEL,
  estadoDaLinha,
  indicadores,
  leituraDaEmpresa,
  leituraDaPessoa,
  pertenceAAba,
  relogioDaLinha,
  TOM_DO_ESTADO,
  type AbaDoAcompanhamento,
  type EstadoDaLinha
} from './leitura';

/**
 * Uma linha da fila, com tudo o que a tabela e a gaveta precisam já
 * resolvido: a situação vem do seletor; nome, empresa, vaga e a data em que
 * a empresa informou a permanência são resolvidos uma vez aqui, e não a cada
 * célula.
 */
type LinhaDaFila = {
  situacao: ReturnType<typeof getAcompanhamento>[number];
  estado: EstadoDaLinha;
  talent: Talent;
  empresa: string;
  vaga: string;
  empresaInformouEm: string | null;
};

const CONTADOR_NA_ABA =
  '**:data-[slot=badge]:h-5 **:data-[slot=badge]:min-w-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1';

/**
 * Acompanhamento de quem foi contratado: a segunda metade do ciclo.
 *
 * A devolutiva de um clique pergunta à empresa "contratou?" — e o RH não
 * volta para dizer se a pessoa ficou (00:05:33). Esta tela é o que o IEL
 * sabe sem depender do RH: a própria pessoa conta, aos 30, 60 e 90 dias, se
 * continua e como está sendo. A fila está na ordem de quem ligar hoje:
 * primeiro quem tem pergunta aberta sem resposta há mais tempo, depois
 * quem contou uma saída que a empresa não informou, depois o resto.
 *
 * Nenhum número sobre a pessoa: "como está sendo" é o que ela disse, com o
 * rótulo escrito. E nada daqui vai para a empresa.
 */
export function AcompanhamentoScreen() {
  const { state } = useIelDemo();
  const [aba, setAba] = useState<AbaDoAcompanhamento>('todos');
  /*
   * A pessoa aberta e o "aberto" são estados separados: fechar a gaveta
   * mantém a pessoa até a animação terminar e o foco voltar ao botão dela.
   * Desmontar no fechamento pulava as duas coisas.
   */
  const [aberta, setAberta] = useState<string | null>(null);
  const [gavetaAberta, setGavetaAberta] = useState(false);

  usePageHeader({ breadcrumb: [{ label: 'Acompanhamento' }] });

  const fila = useMemo(() => getAcompanhamento(state), [state]);

  /*
   * A data em que a empresa informou a permanência mora no item da remessa,
   * não na situação. Um índice por candidatura, montado uma vez: sem ele,
   * cada linha varreria todas as remessas registradas.
   */
  const linhas = useMemo<LinhaDaFila[]>(() => {
    const informadoEm = new Map<string, string | null>();
    for (const referral of getRegisteredReferrals(state)) {
      for (const item of referral.items) {
        informadoEm.set(
          item.applicationId,
          lerDevolutiva(item.outcome).retentionAt ?? null
        );
      }
    }
    const resultado: LinhaDaFila[] = [];
    for (const situacao of fila) {
      const application = getApplication(state, situacao.applicationId);
      const talent = application
        ? getTalent(application.talentId, state)
        : null;
      if (!talent) continue;
      resultado.push({
        situacao,
        estado: estadoDaLinha(situacao),
        talent,
        empresa: getCompany(situacao.companyId)?.name ?? situacao.companyId,
        vaga: getJob(situacao.jobId)?.title ?? situacao.jobId,
        empresaInformouEm: informadoEm.get(situacao.applicationId) ?? null
      });
    }
    return resultado;
  }, [state, fila]);

  const totais = useMemo(() => indicadores(fila), [fila]);

  const porAba = useMemo(() => {
    const grupos = {
      todos: [] as LinhaDaFila[],
      'ligar-hoje': [] as LinhaDaFila[],
      sairam: [] as LinhaDaFila[],
      'em-dia': [] as LinhaDaFila[]
    } satisfies Record<AbaDoAcompanhamento, LinhaDaFila[]>;
    for (const linha of linhas) {
      for (const nome of ABAS_DO_ACOMPANHAMENTO) {
        if (pertenceAAba(nome, linha.situacao, linha.estado))
          grupos[nome].push(linha);
      }
    }
    return grupos;
  }, [linhas]);

  const visiveis = porAba[aba];
  const linhaAberta = aberta
    ? linhas.find((linha) => linha.situacao.applicationId === aberta)
    : undefined;

  const trocarAba = (valor: string) => {
    const escolhida = ABAS_DO_ACOMPANHAMENTO.find((nome) => nome === valor);
    if (escolhida) setAba(escolhida);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Acompanhamento</h1>
        <p className="text-sm text-muted-foreground">
          Quem foi contratado, o que cada lado disse e para quem ligar hoje.
        </p>
      </div>

      <div
        data-tour="acompanhamento-indicadores"
        className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <CartaoDeIndicador
          rotulo="Em acompanhamento"
          valor={totais.emAcompanhamento}
          icone={IconHeartHandshake}
          tom="pessoa"
          rodape="contratados nos últimos 90 dias e um pouco além"
          apoio="Pessoas que a empresa disse ter contratado. O IEL pergunta a cada uma, aos 30, 60 e 90 dias, se continua e como está sendo."
        />
        <CartaoDeIndicador
          rotulo="Para ligar hoje"
          valor={totais.paraLigarHoje}
          icone={IconPhone}
          tom="atencao"
          rodape={
            totais.paraLigarHoje === 0
              ? 'ninguém com pergunta aberta'
              : 'com pergunta aberta e sem resposta'
          }
          apoio="Quem chegou aos 30, 60 ou 90 dias, recebeu a pergunta e ainda não respondeu. Cada pergunta fica aberta por 30 dias."
        />
        <CartaoDeIndicador
          rotulo="Continuam na empresa"
          valor={`${totais.continuam} de ${totais.emAcompanhamento}`}
          icone={IconUserCheck}
          tom="combina"
          rodape={
            totais.sairam === 0
              ? 'ninguém saiu antes dos 90 dias'
              : `${plural(totais.sairam, 'saiu', 'saíram')} antes dos 90 dias${
                  totais.sairamSoPelaPessoa > 0
                    ? ` · ${totais.sairamSoPelaPessoa} só a pessoa contou`
                    : ''
                }`
          }
          apoio="Pelo que se sabe hoje, de qualquer um dos lados. Quando a pessoa diz que saiu e a empresa não informou, conta como saída."
        />
        <CartaoDeIndicador
          rotulo="Empresa não informou"
          valor={totais.empresaNaoInformou}
          icone={IconBuildingSkyscraper}
          tom="empresa"
          rodape="nada depois do “contratei”"
          apoio="Contratações em que a empresa clicou “contratei” e não voltou para dizer se a pessoa ficou. É o que a pergunta à pessoa cobre."
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            value={aba}
            onValueChange={trocarAba}
          >
            <TabsList className={cn(ABAS_SEM_ROLAGEM, CONTADOR_NA_ABA)}>
              {ABAS_DO_ACOMPANHAMENTO.map((nome) => (
                <TabsTrigger
                  key={nome}
                  value={nome}
                >
                  {ABA_LABEL[nome]}{' '}
                  <Badge variant="secondary">{porAba[nome].length}</Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <span
            data-tour="acompanhamento-privacidade"
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <IconLock
              aria-hidden="true"
              className="size-3"
            />
            O que a pessoa responde nunca vai para a empresa.
          </span>
        </div>

        {linhas.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              Ninguém em acompanhamento ainda. A fila começa quando uma empresa
              responder “contratei” a um envio.
            </p>
          </div>
        ) : visiveis.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              {aba === 'ligar-hoje'
                ? 'Ninguém para ligar hoje.'
                : aba === 'sairam'
                  ? 'Ninguém saiu antes dos 90 dias, pelo que se sabe.'
                  : 'Ninguém em dia ainda.'}
            </p>
          </div>
        ) : (
          <div
            data-tour="acompanhamento-fila"
            className="overflow-x-auto rounded-lg border"
          >
            <Table>
              <TableCaption className="sr-only">
                Pessoas contratadas em acompanhamento, na ordem de quem ligar
                primeiro
              </TableCaption>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead scope="col">Pessoa</TableHead>
                  <TableHead scope="col">Na empresa há</TableHead>
                  <TableHead
                    scope="col"
                    className="hidden md:table-cell"
                  >
                    O que a pessoa disse
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="hidden md:table-cell"
                  >
                    O que a empresa disse
                  </TableHead>
                  <TableHead scope="col">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((linha) => {
                  const { situacao, estado, talent } = linha;
                  const pessoa = leituraDaPessoa(situacao);
                  const idDoBotao = `abrir-pessoa-${situacao.applicationId}`;
                  return (
                    <TableRow key={situacao.applicationId}>
                      <TableCell className="max-w-[28ch] whitespace-normal align-top">
                        <Button
                          id={idDoBotao}
                          variant="link"
                          className="h-auto p-0 text-left font-medium whitespace-normal"
                          onClick={() => {
                            setAberta(situacao.applicationId);
                            setGavetaAberta(true);
                          }}
                        >
                          {talent.name}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          {linha.empresa} · {linha.vaga}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-[26ch] whitespace-normal align-top">
                        <span className="tabular-nums">
                          {plural(situacao.diasNaEmpresa, 'dia', 'dias')}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {relogioDaLinha(situacao)}
                        </p>
                      </TableCell>
                      <TableCell className="hidden max-w-[32ch] align-top whitespace-normal md:table-cell">
                        <span>{pessoa.titulo}</span>
                        {pessoa.detalhe ? (
                          <p className="text-xs text-muted-foreground">
                            {pessoa.detalhe}
                          </p>
                        ) : null}
                        {pessoa.comentario ? (
                          <p className="text-xs text-muted-foreground">
                            “{pessoa.comentario}”
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden align-top md:table-cell">
                        {leituraDaEmpresa(situacao)}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge
                          variant="outline"
                          className={cn(
                            'whitespace-normal',
                            BADGE_DE_ESTADO[TOM_DO_ESTADO[estado]]
                          )}
                        >
                          {ESTADO_DA_LINHA_LABEL[estado]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {linhaAberta ? (
        <DetalheDaPessoa
          situacao={linhaAberta.situacao}
          talent={linhaAberta.talent}
          empresa={linhaAberta.empresa}
          vaga={linhaAberta.vaga}
          empresaInformouEm={linhaAberta.empresaInformouEm}
          open={gavetaAberta}
          onOpenChange={setGavetaAberta}
          retornarFocoPara={`abrir-pessoa-${linhaAberta.situacao.applicationId}`}
        />
      ) : null}
    </div>
  );
}

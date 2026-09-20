'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  getSituacaoDaCandidatura,
  getTemasDoCandidato,
  type SituacaoId
} from '@/features/iel-demo/analysis/situacao-da-candidatura';
import { useIelDemo } from '@/features/iel-demo/state/demo-provider';
import {
  getApplication,
  getCandidateJobView,
  getTalent,
  validadeDasRespostas
} from '@/features/iel-demo/state/selectors';
import {
  IconBriefcase,
  IconCircleCheck,
  IconClock,
  IconPencil,
  IconPhone,
  IconSend,
  IconUsers
} from '@tabler/icons-react';
import type { TablerIcon } from '@tabler/icons-react';

import { routes } from '@workspace/routes';
import { cn } from '@workspace/ui/lib/utils';
import { Badge } from '@workspace/ui/shadcn/badge';
import { Button } from '@workspace/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { TalentTransparency } from '../clarifications/talent-transparency';
import { ICONE_TINGIDO } from '../metricas/cores';

/**
 * Minha candidatura: a única tela do produto que responde à pessoa.
 *
 * Até aqui o candidato dava e não recebia. Respondia 10 frases, lia "você não
 * precisa fazer mais nada agora" e acabava ali: não sabia se tinha sido
 * encaminhado, não tinha para onde voltar e, quando a empresa não seguia,
 * ninguém lhe dizia nada. Esta tela responde uma pergunta só — **em que pé
 * está e o que acontece agora** — e nenhum estado dela termina em silêncio.
 *
 * ## O que ela nunca mostra
 *
 * O nome da empresa (R5), inclusive quando a empresa quer entrevistar: quem
 * revela o nome é a pessoa do IEL, na ligação. Posição, ranking ou qualquer
 * comparação com outros candidatos — o produto não classifica pessoas, e esta
 * é a tela de quem mais sofreria com uma classificação. E percentual: a
 * aderência dele é dado dele (PRODUTO.md §5.1), mas volta em palavra, no
 * vocabulário de `copy.ts`.
 *
 * ## Forma
 *
 * Celular primeiro, uma coluna de 390px, alvos de 48px e corpo de 15px. A
 * ordem é a da conversa: o que aconteceu, o que acontece agora, o que fazer,
 * o que você respondeu, o que está registrado sobre você. Sem login e sem
 * cadastro — o link abre direto (00:08:01).
 */

/** "05/09/2027": a validade fica longe e precisa do ano. */
function dataPorExtenso(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** Um ícone por situação. Nunca sozinho: o título ao lado diz o mesmo. */
const ICONE_DA_SITUACAO: Record<SituacaoId, TablerIcon> = {
  'sem-resposta': IconPencil,
  'prazo-vencido': IconClock,
  'em-analise': IconCircleCheck,
  enviado: IconSend,
  'quer-conversar': IconPhone,
  'nao-seguiu': IconUsers,
  contratado: IconBriefcase
};

export function MinhaCandidaturaScreen({
  applicationId
}: {
  applicationId: string;
}) {
  const { state } = useIelDemo();

  const application = getApplication(state, applicationId);
  const jobView = getCandidateJobView(state, applicationId);
  const situacao = getSituacaoDaCandidatura(state, applicationId);

  if (!application || !jobView || !situacao) {
    return (
      <Moldura badge={null}>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>Link inválido</h1>
            </CardTitle>
            <CardDescription>
              Este link não corresponde a nenhuma candidatura. Confira a
              mensagem que você recebeu.
            </CardDescription>
          </CardHeader>
        </Card>
      </Moldura>
    );
  }

  const talent = getTalent(application.talentId, state);
  const temas = getTemasDoCandidato(state, applicationId);
  // A resposta é da pessoa e vale 12 meses: é dela a pergunta "até quando
  // isso que eu respondi continua valendo?", e é aqui que ela volta.
  const validade = validadeDasRespostas(state, application.talentId);
  const Icone = ICONE_DA_SITUACAO[situacao.id];
  const rotas = routes.dashboard.iel.applications.byId(applicationId);
  // Dois destinos possíveis: o questionário da vaga ou, para quem foi
  // contratado, a pergunta "como está sendo?" dos 30, 60 e 90 dias.
  const destinoDaAcao =
    situacao.acao?.destino === 'como-esta-sendo' ? rotas.checkIn : rotas.fit;

  return (
    <Moldura
      badge={
        <Badge
          variant="outline"
          className="font-medium text-muted-foreground"
        >
          Vaga de {jobView.activity}
        </Badge>
      }
    >
      <div className="flex flex-col gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-9 items-center justify-center rounded-lg',
            ICONE_TINGIDO[situacao.tom]
          )}
        >
          <Icone className="size-5" />
        </span>
        <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
          {situacao.titulo}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {situacao.resumo}
        </p>
      </div>

      {/*
       * O bloco que não pode faltar em nenhum estado: de quem é a vez, o que
       * essa pessoa faz e em quanto tempo. É a diferença entre esperar e ser
       * deixado esperando.
       */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <h2>O que acontece agora</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-col gap-4">
            {situacao.agora.map((passo, indice) => (
              <li
                key={passo.quem}
                className="flex gap-3"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground"
                >
                  {indice + 1}
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[15px] leading-snug text-foreground">
                    {passo.quem}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {passo.quando}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
        {situacao.caminho ? (
          <CardFooter>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {situacao.caminho}
            </p>
          </CardFooter>
        ) : null}
      </Card>

      {situacao.acao ? (
        <Button
          size="lg"
          // Corrigir uma resposta já dada é direito, não pendência: o botão
          // fica, mas em contorno, sem empurrar.
          variant={situacao.acao.peso === 'discreta' ? 'outline' : 'default'}
          className="h-12 w-full text-[15px]"
          asChild
        >
          <Link href={destinoDaAcao}>{situacao.acao.rotulo}</Link>
        </Button>
      ) : null}

      {/*
       * O que a pessoa já contou ao IEL depois de contratada. A resposta
       * dela devolvida a ela, em palavra: quem respondeu aos 30 dias e abre
       * o link aos 60 vê que a resposta chegou e o que disse.
       */}
      {situacao.contou && situacao.contou.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <h2>O que você já contou</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2.5">
              {situacao.contou.map((linha) => (
                <li
                  key={linha}
                  className="flex gap-3"
                >
                  <IconCircleCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <p className="text-[15px] leading-relaxed text-foreground">
                    {linha}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A empresa não vê nada disto. Quem lê é só a equipe do IEL.
            </p>
          </CardFooter>
        </Card>
      ) : null}

      {temas ? (
        <Card>
          <CardHeader>
            <CardDescription>Suas respostas</CardDescription>
            <CardTitle className="text-base">
              <h2>O que você respondeu</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/*
             * Palavra, não percentual: §5.1 permite mostrar a aderência da
             * própria pessoa, mas um número numa tela sobre a própria vida
             * vira nota. Aqui são os temas em que ela combinou e aqueles em
             * que ficou diferente — nada de posição nem de outros candidatos.
             */}
            <ListaDeTemas
              titulo="Combinou com a empresa em"
              temas={temas.combinou}
              vazio="Nenhum tema combinou desta vez."
            />
            <ListaDeTemas
              titulo="Ficou diferente em"
              temas={temas.diferente}
              vazio="Nenhum tema ficou diferente."
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-3">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Isto não é nota e não mede desempenho. É só a comparação entre o
              jeito que você prefere trabalhar e o jeito da equipe desta
              empresa. Ficar diferente em um tema não é erro seu.
              {/*
               * Logo abaixo de "esta vaga seguiu com outras pessoas", uma
               * lista do que ficou diferente se lê como o motivo. Não é: a
               * empresa recebe até 5 currículos e decide olhando o conjunto.
               * A frase fecha essa porta antes que ela se abra.
               */}
              {situacao.id === 'nao-seguiu'
                ? ' Estes temas não decidiram sozinhos: a empresa escolhe olhando o currículo inteiro.'
                : null}
            </p>
            {validade?.validaAte ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                As suas respostas ficam guardadas até{' '}
                {dataPorExtenso(validade.validaAte)}. Se você se candidatar a
                outra vaga pelo IEL nesse tempo, a gente pergunta só o que
                faltar — e você pode responder tudo de novo quando quiser.
              </p>
            ) : null}
          </CardFooter>
        </Card>
      ) : null}

      {talent ? <TalentTransparency talentId={talent.id} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            <h2>A vaga</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Os quatro campos de `getCandidateJobView`, e só eles (R5). */}
          <dl className="flex flex-col gap-3 text-[15px]">
            <DadoDaVaga
              rotulo="O que você vai fazer"
              valor={jobView.activity}
            />
            <DadoDaVaga
              rotulo="Onde"
              valor={jobView.location}
            />
            <DadoDaVaga
              rotulo="Ramo da empresa"
              valor={jobView.sector}
            />
            <DadoDaVaga
              rotulo="Turno"
              valor={jobView.shift}
            />
          </dl>
        </CardContent>
        <CardFooter>
          <p className="text-sm leading-relaxed text-muted-foreground">
            O nome da empresa você conhece na entrevista. É assim em todas as
            vagas do IEL.
          </p>
        </CardFooter>
      </Card>

      <p className="pt-2 text-center text-xs leading-relaxed text-muted-foreground">
        Demonstração: nada é enviado de verdade e este link abre direto, sem
        senha e sem cadastro.
      </p>
    </Moldura>
  );
}

function ListaDeTemas({
  titulo,
  temas,
  vazio
}: {
  titulo: string;
  temas: string[];
  vazio: string;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">{titulo}</h3>
      {temas.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {vazio}
        </p>
      ) : (
        <p className="text-[15px] leading-relaxed text-foreground">
          {temas.join(', ')}.
        </p>
      )}
    </section>
  );
}

function DadoDaVaga({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{rotulo}</dt>
      <dd className="leading-snug text-foreground">{valor}</dd>
    </div>
  );
}

/**
 * A mesma moldura do questionário: o quadrado da marca já vem da casca por
 * link, então aqui fica só a etiqueta da vaga — o único jeito de a pessoa
 * saber a que candidatura o link se refere sem descobrir a empresa (R5).
 */
function Moldura({
  badge,
  children
}: {
  badge: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-1 pt-2">
      <div className="flex items-center justify-end gap-2">{badge}</div>
      {children}
    </div>
  );
}

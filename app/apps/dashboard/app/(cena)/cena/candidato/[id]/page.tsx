import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  CenaDoCandidato,
  type DadosDaCena
} from '@/components/iel-demo/cena/cena-do-candidato';
import { contagemDeFrases } from '@/components/iel-demo/cena/roteiro';
import {
  gerarMensagem,
  primeiroNome
} from '@/features/iel-demo/analysis/mensagens';
import { buildInitialDemoState } from '@/features/iel-demo/fixtures';
import {
  estadoCompartilhadoLigado,
  SALA_PADRAO
} from '@/features/iel-demo/state/config';
import {
  getApplication,
  getCandidateJobView,
  getJob,
  getTalent,
  perguntasQueFaltam
} from '@/features/iel-demo/state/selectors';
import { lerSala } from '@/features/iel-demo/state/servidor';
import { fromPersisted } from '@/features/iel-demo/state/storage';
import type { DemoState } from '@/features/iel-demo/types';

import { routes } from '@workspace/routes';

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * O endereço que aparece na bolha. É texto, não navega: o que abre no fim
 * da cena é a rota real do questionário, dentro do celular. O domínio é o
 * do produto na casa do IEL, e não o de terceiros.
 */
const DOMINIO_DO_LINK = 'mindrh.iel.org.br';

/**
 * O mesmo estado com que o `IelDemoProvider` do layout começa.
 *
 * Isto importa por dois motivos. O primeiro é que a contagem de frases tem
 * de ser a que o celular vai mostrar: as competências que a empresa escolhe
 * moram no estado da demonstração, não nas fixtures. O segundo é a
 * hidratação — a legenda é escrita no HTML do servidor, e se o cliente
 * começasse de outro estado o texto trocaria no primeiro quadro.
 */
async function estadoDaCena(): Promise<DemoState> {
  if (!estadoCompartilhadoLigado()) return buildInitialDemoState();
  try {
    const sala = await lerSala(SALA_PADRAO);
    return fromPersisted(sala.persisted);
  } catch {
    // Mesma decisão do layout: sem sala, a cena segue no estado local.
    return buildInitialDemoState();
  }
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const estado = await estadoDaCena();
  const candidatura = getApplication(estado, id);
  const talento = candidatura ? getTalent(candidatura.talentId, estado) : null;
  return {
    title: talento ? `${primeiroNome(talento.name)} se candidata` : 'Cena'
  };
}

/**
 * A cena do candidato: três atos num celular desenhado, e no terceiro o
 * questionário real.
 *
 * Os dados vêm dos mesmos seletores que a tela do candidato usa —
 * `getCandidateJobView` entrega a vaga sem o nome da empresa (R5), e
 * `gerarMensagem` é a mesma regra fixa que a analista vê em "Mensagem do
 * Mind". A cena não inventa texto: ela mostra o que o IEL manda.
 */
export default async function CenaDoCandidatoPage({ params }: PageProps) {
  const { id } = await params;

  const estado = await estadoDaCena();
  const candidatura = getApplication(estado, id);
  const talento = candidatura ? getTalent(candidatura.talentId, estado) : null;
  const vaga = candidatura ? getJob(candidatura.jobId) : null;
  const visaoDaVaga = getCandidateJobView(estado, id);
  if (!candidatura || !talento || !vaga || !visaoDaVaga) notFound();

  /*
   * Quantas frases esta pessoa ainda responde. Não é constante: a empresa
   * escolhe de 3 a 11 competências, e o que ela já respondeu em outra vaga
   * é reaproveitado. A legenda do terceiro ato e o número da bolha saem
   * daqui, do mesmo lugar, para não dizerem coisas diferentes.
   */
  const frasesQueFaltam = perguntasQueFaltam(estado, id).length;

  const linkNaMensagem = `${DOMINIO_DO_LINK}/c/${id}`;
  const mensagem = gerarMensagem({
    etapa: 'convite-questionario',
    primeiroNome: primeiroNome(talento.name),
    atividade: visaoDaVaga.activity,
    localidade: visaoDaVaga.location,
    turno: visaoDaVaga.shift,
    link: `https://${linkNaMensagem}`
  });

  const dados: DadosDaCena = {
    applicationId: id,
    primeiroNome: primeiroNome(talento.name),
    vaga: {
      atividade: visaoDaVaga.activity,
      localidade: visaoDaVaga.location,
      turno: visaoDaVaga.shift,
      segmento: visaoDaVaga.sector,
      resumo: vaga.summary,
      requisitos: vaga.essentialRequirements.slice(0, 2)
    },
    mensagem: comAContagemCerta(mensagem.texto, frasesQueFaltam),
    linkNaMensagem,
    frasesQueFaltam,
    hrefDoQuestionario: routes.dashboard.iel.applications.byId(id).fit,
    /*
     * O produto manda `X-Frame-Options: deny` em toda resposta
     * (next.config.ts), o que fecha o iframe até para a mesma origem. Com
     * `SECURITY_X_FRAME_OPTIONS=sameorigin` a página real entra num iframe
     * de 390 px; sem isso, o celular monta o próprio componente do
     * questionário — a mesma tela, o mesmo estado, sem passar pela rede.
     */
    modoDoQuestionario:
      process.env.SECURITY_X_FRAME_OPTIONS === 'sameorigin'
        ? 'iframe'
        : 'embutido'
  };

  return <CenaDoCandidato dados={dados} />;
}

/**
 * A bolha e a tela dizendo o mesmo número.
 *
 * A regra fixa (`analysis/mensagens.ts`) escreve "10 frases" no convite, um
 * número que valia quando toda empresa perguntava dez. Corrigir isso lá
 * dentro mudaria o que a analista envia de todas as telas — e o arquivo
 * está sendo mexido agora, por causa das competências de 3 a 11. Então a
 * cena, e só ela, troca o número pelo desta candidatura: mesma frase, mesmo
 * tom, número verdadeiro.
 *
 * Se a regra passar a dizer o número certo sozinha, esta troca vira
 * inofensiva (escreve o mesmo que já estava); se ela mudar de redação a
 * ponto de não casar, o texto volta intacto em vez de sair quebrado.
 */
function comAContagemCerta(texto: string, frasesQueFaltam: number): string {
  const quantas =
    frasesQueFaltam >= 1 ? contagemDeFrases(frasesQueFaltam) : 'as frases';
  return texto.replace(/\b\d+ frases\b/, quantas);
}

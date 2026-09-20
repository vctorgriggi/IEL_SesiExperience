import { FIT_AXES } from '@/features/iel-demo/analysis/fit-axes';
import {
  getItem,
  ITENS_DO_INSTRUMENTO,
  rotuloDaEscala,
  type ValorDaEscala
} from '@/features/iel-demo/analysis/instrumento';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@workspace/ui/shadcn/card';

import { LADO } from '../metricas/cores';

/**
 * "Suas respostas": o que a pessoa acabou de responder, devolvido a ela como
 * linha de teste — a frase do cliente, sem edição, e, ao lado, o grau no
 * vocabulário da escala
 * ("Discordo muito" … "Concordo muito").
 *
 * ## Por que assim, e não uma leitura
 *
 * A devolutiva anterior lia as respostas e dizia "você gosta de conferir
 * cada etapa", "um lugar que combina com você". O dono do produto vetou
 * (20/09/2026): "o resultado não pode falar 'você é assim, assim e assado',
 * porque isso entra no viés". O instrumento não classifica pessoa
 * (PRODUTO.md §11), e uma frase sobre quem a pessoa é, por mais gentil,
 * classifica. O que sobra é o dado, do jeito que foi dado: sem percentual,
 * sem comparação com a empresa, sem adjetivo.
 *
 * O grau sai de `rotuloDaEscala`, a leitura da analista, e não do rótulo da
 * régua ("Sou eu", "É bem assim aqui"): é a linha do instrumento, a mesma
 * que aparece no relatório. 5 é 5.
 *
 * A ordem é a dos temas (`FIT_AXES`) e, dentro do tema, a do instrumento.
 * Sem nome de tema na tela: "tema" é jargão da analista.
 */
export function SuasRespostas({
  respostas,
  papel,
  moldura = 'cartao'
}: {
  respostas: Record<string, ValorDaEscala>;
  papel: 'candidato' | 'colaborador';
  /** `secao` quando o bloco entra dentro de outro cartão. */
  moldura?: 'cartao' | 'secao';
}) {
  const linhas = ordenarPorTema(respostas);
  if (linhas.length === 0) return null;

  const tom = papel === 'candidato' ? 'pessoa' : 'empresa';
  const rodape =
    papel === 'candidato'
      ? 'É o que você respondeu. Ninguém vê suas respostas uma a uma além da equipe do IEL.'
      : 'É o que você respondeu. Entra numa média com a equipe; ninguém vê a sua sozinha.';

  const lista = (
    <ul className="flex flex-col divide-y">
      {linhas.map((linha) => (
        <li
          key={linha.itemId}
          className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
        >
          <p className="text-[15px] leading-snug text-foreground">
            {linha.frase}
          </p>
          <p
            className={`shrink-0 pt-px text-right text-sm font-medium ${LADO[tom].texto}`}
          >
            {linha.grau}
          </p>
        </li>
      ))}
    </ul>
  );

  if (moldura === 'secao') {
    return (
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Suas respostas</h3>
        {lista}
        <p className="text-sm leading-relaxed text-muted-foreground">
          {rodape}
        </p>
      </section>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <h2>Suas respostas</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>{lista}</CardContent>
      <CardFooter>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {rodape}
        </p>
      </CardFooter>
    </Card>
  );
}

type LinhaDeResposta = { itemId: string; frase: string; grau: string };

/** As respostas na ordem dos temas e, dentro do tema, na do instrumento. */
function ordenarPorTema(
  respostas: Record<string, ValorDaEscala>
): LinhaDeResposta[] {
  const posicaoDoTema = new Map(
    FIT_AXES.map((axis, index) => [axis.id, index])
  );
  const posicaoDoItem = new Map(
    ITENS_DO_INSTRUMENTO.map((item, index) => [item.id, index])
  );

  return Object.entries(respostas)
    .map(([itemId, valor]) => {
      const item = getItem(itemId);
      if (!item) return null;
      return {
        itemId,
        frase: item.texto,
        grau: rotuloDaEscala(valor),
        ordem: [
          posicaoDoTema.get(item.tema) ?? FIT_AXES.length,
          posicaoDoItem.get(itemId) ?? ITENS_DO_INSTRUMENTO.length
        ]
      };
    })
    .filter((linha): linha is NonNullable<typeof linha> => linha !== null)
    .sort((a, b) => a.ordem[0]! - b.ordem[0]! || a.ordem[1]! - b.ordem[1]!)
    .map(({ itemId, frase, grau }) => ({ itemId, frase, grau }));
}

export function getTicketPriceLabel(
  ticketTypes: { priceCents: number }[]
): string {
  const paidTickets = ticketTypes.filter((t) => t.priceCents > 0);

  if (paidTickets.length === 0) {
    return 'Ingresso gratuito';
  }

  const minPrice = Math.min(...paidTickets.map((t) => t.priceCents));
  const price = (minPrice / 100).toFixed(2);

  return ticketTypes.length === 1
    ? `Ingresso: R$ ${price}`
    : `A partir de R$ ${price}`;
}

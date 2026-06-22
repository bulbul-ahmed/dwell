/** Bangladeshi comma grouping: 1,00,000 */
export function bdGroup(n: number): string {
  const s = String(Math.round(n));
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  if (rest) rest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (rest ? rest + ',' : '') + last3;
}

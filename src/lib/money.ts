/**
 * Money helpers — centralised so we have one consistent rounding rule.
 *
 * NOTE: amounts are still stored as `Number` in MongoDB. JavaScript floats
 * lose precision on arithmetic (`0.1 + 0.2 !== 0.3`). All money math should
 * route through these helpers so the rounding rule is uniform, and a future
 * migration to `Decimal128` or integer minor-units (pesewas) only needs to
 * change this file plus the model schemas.
 */

/** Round to 2 decimal places using integer cents internally. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/** Stake × odds, rounded once at the end (avoids compounding rounding error). */
export function calcPayout(stake: number, totalOdds: number, cap?: number): number {
  const raw = stake * totalOdds;
  const capped = cap !== undefined ? Math.min(raw, cap) : raw;
  return roundMoney(capped);
}

/** Multiply a chain of decimal odds and return the total rounded to 4dp. */
export function totalOddsOf(odds: number[]): number {
  const product = odds.reduce((acc, o) => acc * o, 1);
  return Math.round(product * 10_000) / 10_000;
}

/** True if two money values are equal within 1 cent. */
export function moneyEqual(a: number, b: number): boolean {
  return Math.abs(roundMoney(a) - roundMoney(b)) < 0.01;
}

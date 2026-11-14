const cache = new Map<number, Intl.NumberFormat>();

function nf(decimals: number) {
  let f = cache.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    cache.set(decimals, f);
  }
  return f;
}

export function fmt(value: number, decimals = 1): string {
  return nf(decimals).format(value);
}

/** 0.238 -> "23.8%"; signed: -0.021 -> "−2.1%" */
export function fmtPct(ratio: number, signed = false): string {
  const pct = ratio * 100;
  const body = nf(Math.abs(pct) >= 10 ? 0 : 1).format(Math.abs(pct)) + '%';
  if (!signed) return (pct < 0 ? '−' : '') + body;
  return (pct < 0 ? '−' : pct > 0 ? '+' : '') + body;
}

export function fmtSigned(value: number, decimals = 1): string {
  const s = nf(decimals).format(Math.abs(value));
  return (value < 0 ? '−' : value > 0 ? '+' : '±') + s;
}

/** "Oct 28" */
export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** "Oct 28, 23:59 UTC" */
export function fmtDateTime(iso: string): string {
  return (
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'UTC',
    }) + ' UTC'
  );
}

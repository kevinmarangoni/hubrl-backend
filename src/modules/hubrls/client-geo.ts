import type { Request } from 'express';

const COUNTRY_HEADER_KEYS = ['x-hubrl-client-country', 'cf-ipcountry', 'x-vercel-ip-country'] as const;

/**
 * IP do visitante: prioriza cabeçalho repassado pelo BFF (Next),
 * depois X-Forwarded-For / X-Real-IP (com trust proxy no Nest).
 */
export function resolveClientIp(req: Request): string | undefined {
  const propagated = (req.headers['x-hubrl-client-ip'] as string | undefined)?.trim();
  if (propagated && propagated.toLowerCase() !== 'unknown') {
    return propagated.split(',')[0]?.trim();
  }
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0]?.trim();
  }
  if (Array.isArray(xff) && xff[0]) {
    return xff[0].split(',')[0]?.trim();
  }
  const rip = req.headers['x-real-ip'];
  if (typeof rip === 'string' && rip.trim()) {
    return rip.trim();
  }
  return req.socket?.remoteAddress ?? undefined;
}

/** ISO 3166-1 alpha-2 em maiúsculas, quando confiável. */
export function resolveCountryCode(req: Request, ip: string | undefined): string | undefined {
  for (const key of COUNTRY_HEADER_KEYS) {
    const raw = (req.headers[key] as string | undefined)?.trim().toUpperCase();
    if (raw && /^[A-Z]{2}$/.test(raw) && raw !== 'XX' && raw !== 'T1') {
      return raw;
    }
  }

  let geoip: { lookup: (addr: string) => { country?: string } | null } | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    geoip = require('geoip-lite') as { lookup: (addr: string) => { country?: string } | null };
  } catch {
    return undefined;
  }

  if (!ip) {
    return undefined;
  }
  const clean = ip.replace(/^::ffff:/, '');
  if (clean === '::1' || clean === '127.0.0.1') {
    return undefined;
  }
  const hit = geoip.lookup(clean);
  const c = hit?.country?.toUpperCase();
  return c && /^[A-Z]{2}$/.test(c) ? c : undefined;
}

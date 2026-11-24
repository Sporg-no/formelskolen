'use client';
// Fremdrift lagres alltid lokalt. Innloggede brukere synkes i tillegg til databasen.

const KEY = 'fs:progress';
const EVT = 'fs:progress';

export function localProgress(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function markDoneLocal(slug: string) {
  try {
    const p = localProgress();
    if (!p[slug]) { p[slug] = new Date().toISOString(); localStorage.setItem(KEY, JSON.stringify(p)); }
    window.dispatchEvent(new Event(EVT));
  } catch { /* privat modus o.l. */ }
}

export async function syncDone(slugs: string[]) {
  if (!slugs.length) return;
  try {
    await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slugs }) });
  } catch { /* prøver igjen neste gang */ }
}

export function onProgress(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener(EVT, cb); window.removeEventListener('storage', cb); };
}

export function loadSheet(slug: string): Record<string, string> | null {
  try { const v = localStorage.getItem(`fs:sheet:${slug}`); return v ? JSON.parse(v) : null; } catch { return null; }
}
export function saveSheet(slug: string, cells: Record<string, string>) {
  try { localStorage.setItem(`fs:sheet:${slug}`, JSON.stringify(cells)); } catch { /* full lagring */ }
}
export function clearSheet(slug: string) {
  try { localStorage.removeItem(`fs:sheet:${slug}`); } catch { /* ignorer */ }
}
